import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adaptSessionMessages } from '@/lib/message-adapter';

export function useChat({ sessionId: urlSessionId, onSessionCreated } = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const abortRef = useRef(null);
  const activeSessionId = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (urlSessionId && urlSessionId !== activeSessionId.current) {
      activeSessionId.current = urlSessionId;
      setIsLoadingHistory(true);
      api.getSession(urlSessionId)
        .then((data) => {
          setMessages(adaptSessionMessages(data.messages));
        })
        .catch(() => {
          setMessages([]);
        })
        .finally(() => setIsLoadingHistory(false));
    } else if (!urlSessionId && activeSessionId.current) {
      activeSessionId.current = null;
      setMessages([]);
    }
  }, [urlSessionId]);

  const sendMessage = useCallback(async (content) => {
    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsg = { role: 'assistant', content: '', toolCalls: [] };
    setMessages((prev) => [...prev, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      const headers = { 'Content-Type': 'application/json' };
      if (activeSessionId.current) {
        headers['X-Hermes-Session-Id'] = activeSessionId.current;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-agent',
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const is403 = res.status === 403;
        throw new Error(
          is403 && activeSessionId.current
            ? '继续历史对话需要配置 API_SERVER_KEY。请在 .env 或环境变量中设置后重启 Hermes Gateway。'
            : errText || `HTTP ${res.status}`
        );
      }

      const newSessionId = res.headers.get('X-Hermes-Session-Id');
      if (newSessionId && newSessionId !== activeSessionId.current) {
        const isNew = !activeSessionId.current;
        activeSessionId.current = newSessionId;
        if (isNew) {
          onSessionCreated?.(newSessionId);
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              accumulated += delta.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated };
                return updated;
              });
            }
            if (delta?.tool_calls) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                last.toolCalls = [...(last.toolCalls || []), ...delta.tool_calls];
                updated[updated.length - 1] = last;
                return updated;
              });
            }
          } catch {}
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
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  }, [messages, onSessionCreated, queryClient]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    activeSessionId.current = null;
  }, []);

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
