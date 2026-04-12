import { useState, useRef, useCallback } from 'react';
import { SendHorizonal, Square } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ChatInput({ onSend, isStreaming, onStop }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="relative bg-surface/80 backdrop-blur-sm px-4 pb-4 pt-3">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-surface to-transparent" />
      <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="输入消息...（Shift+Enter 换行）"
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-warm-border bg-white px-4 py-3 pr-12',
              'text-sm text-warm-text placeholder:text-warm-muted',
              'focus:outline-none focus:border-hermes/40 focus:ring-2 focus:ring-hermes/10',
              'scrollbar-thin transition-all duration-200'
            )}
          />
        </div>
        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-200 flex items-center justify-center"
            title="停止"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              'shrink-0 w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center',
              value.trim()
                ? 'bg-gradient-to-br from-hermes to-hermes-dark text-white shadow-warm hover:shadow-warm-lg hover:scale-[1.03] active:scale-95'
                : 'bg-surface-overlay text-warm-muted cursor-not-allowed'
            )}
            title="发送"
          >
            <SendHorizonal size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
