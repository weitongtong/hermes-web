import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import SessionPanel from '@/components/chat/SessionPanel';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const onSessionCreated = useCallback(
    (newId) => navigate(`/chat/${encodeURIComponent(newId)}`, { replace: true }),
    [navigate],
  );

  const { messages, isStreaming, isLoadingHistory, sendMessage, stopStreaming, resetChat } =
    useChat({ sessionId, onSessionCreated });

  const handleNewChat = useCallback(() => {
    resetChat();
    navigate('/chat');
  }, [resetChat, navigate]);

  return (
    <div className="flex h-full bg-white">
      <SessionPanel onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader sessionId={sessionId} onNewChat={handleNewChat} />
        <ChatMessages
          messages={messages}
          isLoading={isLoadingHistory}
          onSuggestionClick={sendMessage}
        />
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={stopStreaming}
        />
      </div>
    </div>
  );
}
