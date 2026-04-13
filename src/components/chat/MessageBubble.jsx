import { User, Sparkles, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { stripThinking } from '@/lib/strip-thinking';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ToolCallCard from './ToolCallCard';
import ThinkingBlock from './ThinkingBlock';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2 px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-hermes/60 dot-bounce-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-hermes/60 dot-bounce-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-hermes/60 dot-bounce-3" />
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-warm-muted hover:text-warm-secondary hover:bg-surface-overlay transition-colors duration-150"
      title="复制"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex justify-end animate-slide-in-right">
      <div className="flex items-center gap-2.5 max-w-[75%]">
        <div className="bg-hermes/8 text-warm-text rounded-2xl rounded-br-md px-4 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full bg-warm-text/8 flex items-center justify-center">
          <User size={14} className="text-warm-secondary" />
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ message, display, thinking, isThinking }) {
  const hasNoContent = !display && !thinking && !isThinking && !message.toolCalls?.length && !message.content;
  const isError = message.isError;

  return (
    <div className="animate-slide-in-left">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-hermes/15 to-hermes/5 flex items-center justify-center mt-1 ring-1 ring-hermes/10">
          <Sparkles size={14} className="text-hermes" />
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          {thinking && <ThinkingBlock content={thinking} />}

          {display && (
            <div className={cn(
              'group/msg relative bg-surface-overlay/50 rounded-2xl rounded-tl-md px-4 py-2',
              isError && 'text-red-500',
            )}>
              <MarkdownRenderer content={display} />
              {!isError && display.length > 20 && (
                <div className="absolute right-2 top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
                  <CopyButton text={display} />
                </div>
              )}
            </div>
          )}

          {message.toolCalls?.length > 0 && (
            <div className="space-y-1.5">
              {message.toolCalls.map((tc, i) => (
                <ToolCallCard key={tc.id || i} toolCall={tc} />
              ))}
            </div>
          )}

          {(isThinking || hasNoContent) && (
            <div className="bg-surface-overlay/50 rounded-2xl rounded-tl-md px-4 py-1">
              <TypingDots />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const { display, thinking, isThinking } = isUser
    ? { display: message.content, thinking: '', isThinking: false }
    : stripThinking(message.content);

  return (
    <div className="py-2.5">
      {isUser ? (
        <UserMessage content={message.content} />
      ) : (
        <AssistantMessage
          message={message}
          display={display}
          thinking={thinking}
          isThinking={isThinking}
        />
      )}
    </div>
  );
}
