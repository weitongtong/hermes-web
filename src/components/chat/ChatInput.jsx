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
    <div className="relative bg-surface border-t border-gray-100 px-4 pb-4 pt-3">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-surface to-transparent" />
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
              'w-full resize-none rounded-2xl border border-gray-200 bg-surface px-4 py-3 pr-12',
              'text-sm text-gray-900 placeholder:text-gray-400',
              'focus:outline-none focus:border-hermes/50 focus:ring-2 focus:ring-hermes/10',
              'shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]',
              'scrollbar-thin transition-all duration-150'
            )}
          />
        </div>
        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
            title="停止"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              'shrink-0 w-10 h-10 rounded-xl transition-all duration-150 flex items-center justify-center',
              value.trim()
                ? 'bg-gradient-to-br from-hermes to-hermes-dark text-white shadow-md shadow-hermes/20 hover:shadow-lg hover:shadow-hermes/30 hover:scale-[1.03] active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
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
