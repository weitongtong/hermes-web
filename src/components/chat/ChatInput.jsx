import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ChatInput({ onSend, isStreaming, onStop }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      textareaRef.current?.focus();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

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
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="bg-white border-t border-warm-border/30 px-4 pb-5 pt-3">
      <div className="max-w-3xl mx-auto">
        <div className={cn(
          'relative rounded-2xl border bg-surface/50 transition-all duration-200',
          'focus-within:bg-white focus-within:shadow-float focus-within:border-warm-border/60',
          isStreaming ? 'border-hermes/20 bg-hermes/[0.02]' : 'border-warm-border/50',
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="给 Hermes 发消息..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-warm-text placeholder:text-warm-muted/70 focus:outline-none scrollbar-thin leading-relaxed"
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-8 h-8 rounded-xl bg-warm-text hover:bg-warm-text/80 text-white flex items-center justify-center transition-colors duration-150"
                title="停止生成"
              >
                <Square size={12} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                  canSend
                    ? 'bg-warm-text text-white hover:bg-warm-text/80 active:scale-90'
                    : 'bg-surface-overlay text-warm-muted/50 cursor-not-allowed',
                )}
                title="发送消息"
              >
                <ArrowUp size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-warm-muted/50 text-center mt-2.5 select-none">
          Enter 发送 · Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
