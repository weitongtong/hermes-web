import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adaptSessionMessages } from '@/lib/message-adapter';
import { parseSSEStream } from '@/lib/parse-sse';

let msgCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

function buildOptimisticSession(sessionId, firstMessage) {
  const preview = firstMessage.trim().replace(/\s+/g, ' ').slice(0, 80);
  return {
    id: sessionId,
    source: 'api_server',
    model: 'hermes-agent',
    title: preview || null,
    message_count: 1,
    started_at: Math.floor(Date.now() / 1000),
    ended_at: null,
    input_tokens: 0,
    output_tokens: 0,
    estimated_cost_usd: 0,
  };
}

function upsertSession(existing, incoming) {
  const list = Array.isArray(existing) ? existing : [];
  const merged = [incoming, ...list.filter((session) => session.id !== incoming.id)];
  merged.sort((a, b) => (b.started_at || 0) - (a.started_at || 0));
  return merged;
}

function mergeToolCallChunks(existing, incoming) {
  const merged = [...(existing || [])];
  for (const chunk of incoming) {
    const idx = chunk.index ?? merged.length;
    if (idx < merged.length) {
      const target = { ...merged[idx] };
      const fn = { ...target.function };
      if (chunk.function?.name) fn.name = (fn.name || '') + chunk.function.name;
      if (chunk.function?.arguments) fn.arguments = (fn.arguments || '') + chunk.function.arguments;
      target.function = fn;
      if (chunk.id) target.id = chunk.id;
      if (chunk.type) target.type = chunk.type;
      merged[idx] = target;
    } else {
      merged.push({
        id: chunk.id,
        type: chunk.type || 'function',
        function: {
          name: chunk.function?.name || '',
          arguments: chunk.function?.arguments || '',
        },
      });
    }
  }
  return merged;
}

export function useChat({ sessionId: urlSessionId, onSessionCreated } = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const abortRef = useRef(null);
  const activeSessionId = useRef(null);
  const messagesRef = useRef([]);
  const titleRefreshTimersRef = useRef([]);
  const queryClient = useQueryClient();

  const clearTitleRefreshTimers = useCallback(() => {
    for (const timer of titleRefreshTimersRef.current) {
      window.clearTimeout(timer);
    }
    titleRefreshTimersRef.current = [];
  }, []);

  const refreshSessionQueries = useCallback((sessionId) => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    }
  }, [queryClient]);

  const scheduleTitleRefreshes = useCallback((sessionId) => {
    if (!sessionId) return;
    clearTitleRefreshTimers();
    for (const delay of [1500, 5000, 12000]) {
      const timer = window.setTimeout(() => refreshSessionQueries(sessionId), delay);
      titleRefreshTimersRef.current.push(timer);
    }
  }, [clearTitleRefreshTimers, refreshSessionQueries]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => clearTitleRefreshTimers, [clearTitleRefreshTimers]);

  useEffect(() => {
    if (urlSessionId && urlSessionId !== activeSessionId.current) {
      clearTitleRefreshTimers();
      activeSessionId.current = urlSessionId;
      setIsLoadingHistory(true);
      api
        .getSession(urlSessionId)
        .then((data) => {
          const adapted = adaptSessionMessages(data.messages).map((m) => ({
            ...m,
            id: nextId(),
          }));
          setMessages(adapted);
        })
        .catch(() => setMessages([]))
        .finally(() => setIsLoadingHistory(false));
    } else if (!urlSessionId && activeSessionId.current) {
      clearTitleRefreshTimers();
      activeSessionId.current = null;
      setMessages([]);
    }
  }, [clearTitleRefreshTimers, urlSessionId]);

  const sendMessage = useCallback(
    async (content) => {
      const userMsg = { id: nextId(), role: 'user', content };
      const assistantMsg = { id: nextId(), role: 'assistant', content: '', toolCalls: [] };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let shouldPollForTitle = false;

      try {
        const currentMessages = messagesRef.current;
        shouldPollForTitle = currentMessages.filter((msg) => msg.role === 'user').length === 0;
        const apiMessages = [...currentMessages, userMsg].map(({ role, content: c }) => ({
          role,
          content: c,
        }));

        const headers = { 'Content-Type': 'application/json' };
        if (activeSessionId.current) {
          headers['X-Hermes-Session-Id'] = activeSessionId.current;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: 'hermes-agent', messages: apiMessages, stream: true }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(
            res.status === 403 && activeSessionId.current
              ? '继续历史对话需要配置 API_SERVER_KEY。请在 .env 或环境变量中设置后重启 Hermes Gateway。'
              : errText || `HTTP ${res.status}`,
          );
        }

        const newSessionId = res.headers.get('X-Hermes-Session-Id');
        if (newSessionId && newSessionId !== activeSessionId.current) {
          const isNew = !activeSessionId.current;
          activeSessionId.current = newSessionId;
          if (isNew) {
            // Show a brand-new chat in the sidebar immediately while state.db catches up.
            queryClient.setQueriesData(
              { queryKey: ['sessions'] },
              (existing) => upsertSession(existing, buildOptimisticSession(newSessionId, content)),
            );
            onSessionCreated?.(newSessionId);
          }
        }

        let accumulated = '';
        let accToolCalls = [];

        for await (const parsed of parseSSEStream(res.body)) {
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            accumulated += delta.content;
            const snap = accumulated;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: snap };
              return updated;
            });
          }

          if (delta.tool_calls) {
            accToolCalls = mergeToolCallChunks(accToolCalls, delta.tool_calls);
            const snap = accToolCalls;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], toolCalls: snap };
              return updated;
            });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: `Error: ${err.message}`,
              isError: true,
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        refreshSessionQueries(activeSessionId.current);
        if (shouldPollForTitle && activeSessionId.current) {
          scheduleTitleRefreshes(activeSessionId.current);
        }
      }
    },
    [onSessionCreated, queryClient, refreshSessionQueries, scheduleTitleRefreshes],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    clearTitleRefreshTimers();
    setMessages([]);
    setIsStreaming(false);
    activeSessionId.current = null;
  }, [clearTitleRefreshTimers]);

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    stopStreaming,
    resetChat,
    sessionId: activeSessionId.current,
  };
}
