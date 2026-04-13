import { useAutoScroll } from '@/hooks/useAutoScroll';
import MessageBubble from './MessageBubble';
import ChatEmptyState from './ChatEmptyState';

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-hermes/40 dot-bounce-1" />
          <div className="w-2 h-2 rounded-full bg-hermes/40 dot-bounce-2" />
          <div className="w-2 h-2 rounded-full bg-hermes/40 dot-bounce-3" />
        </div>
        <span className="text-xs text-warm-muted">加载对话...</span>
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, isLoading, onSuggestionClick }) {
  const { containerRef } = useAutoScroll([messages]);

  if (isLoading) return <LoadingSkeleton />;

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <ChatEmptyState onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin bg-white">
      <div className="max-w-3xl mx-auto px-5 py-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
