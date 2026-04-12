import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatSessionList from '@/components/chat/ChatSessionList';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const onSessionCreated = useCallback(
    (newId) => navigate(`/chat/${encodeURIComponent(newId)}`, { replace: true }),
    [navigate],
  );

  const {
    messages,
    isStreaming,
    isLoadingHistory,
    sendMessage,
    stopStreaming,
    resetChat,
  } = useChat({ sessionId, onSessionCreated });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    resetChat();
    navigate('/chat');
  };

  return (
    <div className="flex h-full">
      <ChatSessionList resetChat={resetChat} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] z-10">
          <h1 className="text-sm font-medium text-gray-700">
            {sessionId ? '对话' : '新对话'}
          </h1>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-hermes transition-colors"
          >
            <Plus size={14} />
            新建对话
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin bg-surface">
          {isLoadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-hermes" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-hermes/10 blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-hermes to-hermes-dark flex items-center justify-center shadow-lg shadow-hermes/20">
                  <span className="text-white text-3xl font-bold">H</span>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Hermes Agent</h2>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                开始与 Hermes 对话。它可以执行命令、管理文件、编写代码等。
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-2">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
      </div>
    </div>
  );
}
