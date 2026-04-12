import { useState } from 'react';
import { User, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ToolCallCard from './ToolCallCard';

const THINK_RE = /<think>([\s\S]*?)<\/think>/g;

function stripThinking(content) {
  if (!content) return { display: '', thinking: '', isThinking: false };

  const thinkBlocks = [];
  let display = content.replace(THINK_RE, (_match, inner) => {
    thinkBlocks.push(inner.trim());
    return '';
  }).trim();

  const openCount = (content.match(/<think>/g) || []).length;
  const closeCount = (content.match(/<\/think>/g) || []).length;

  return {
    display,
    thinking: thinkBlocks.join('\n\n'),
    isThinking: openCount > closeCount,
  };
}

function ThinkingBlock({ content }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left text-xs text-gray-400 border border-gray-100 rounded-lg px-3 py-2 hover:bg-surface-overlay/60 transition-colors"
    >
      <span className="flex items-center gap-1.5 font-medium">
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Thinking
      </span>
      {open && (
        <pre className="mt-2 whitespace-pre-wrap text-gray-500 font-normal leading-relaxed">{content}</pre>
      )}
    </button>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const { display, thinking, isThinking } = isUser
    ? { display: message.content, thinking: '', isThinking: false }
    : stripThinking(message.content);

  return (
    <div className={cn('flex gap-3 py-3 animate-fade-in-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('min-w-0', isUser ? 'max-w-[75%]' : 'flex-1 max-w-[85%]')}>
        {isUser ? (
          <div className="flex justify-end">
            <div className="bg-gradient-to-br from-hermes to-hermes-dark text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm">
              {message.content}
            </div>
          </div>
        ) : (
          <div className={cn('space-y-2', isError && 'text-red-500')}>
            {thinking && <ThinkingBlock content={thinking} />}
            {display && <MarkdownRenderer content={display} />}
            {message.toolCalls?.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {message.toolCalls.map((tc, i) => (
                  <ToolCallCard key={i} toolCall={tc} />
                ))}
              </div>
            )}
            {isThinking && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-hermes animate-pulse" />
                Thinking...
              </div>
            )}
            {!display && !thinking && !isThinking && !message.toolCalls?.length && !message.content && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-hermes animate-pulse" />
                Thinking...
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-hermes/20 to-hermes/5 flex items-center justify-center mt-0.5">
          <User size={15} className="text-hermes-dark" />
        </div>
      )}
    </div>
  );
}
