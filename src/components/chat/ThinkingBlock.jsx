import { useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ThinkingBlock({ content }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;

  return (
    <div className="rounded-xl border border-dashed border-warm-border/70 bg-gradient-to-r from-surface-overlay/50 to-transparent overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-surface-overlay/40 transition-colors duration-200"
      >
        <div className="w-5 h-5 rounded-md bg-accent/8 flex items-center justify-center shrink-0">
          <Brain size={11} className="text-accent" />
        </div>
        <span className="text-xs font-medium text-warm-secondary flex-1">思考过程</span>
        <ChevronDown
          size={13}
          className={cn(
            'text-warm-muted transition-transform duration-200',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-3.5 pb-3 pt-0">
          <pre className="whitespace-pre-wrap text-xs text-warm-muted leading-relaxed font-normal">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
