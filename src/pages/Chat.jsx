import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
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

  const { messages, isStreaming, isLoadingHistory, sendMessage, stopStreaming } =
    useChat({ sessionId, onSessionCreated });

  const handleNewChat = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  return (
    <div className="flex h-full flex-col min-w-0 bg-white">
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
  );
}
