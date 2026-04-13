import { useState } from 'react';
import { Play, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ToolCallCard({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  const name = toolCall?.function?.name || toolCall?.name || 'tool';
  let args = toolCall?.function?.arguments || toolCall?.arguments || '';
  if (typeof args === 'string') {
    try { args = JSON.parse(args); } catch { /* keep as string */ }
  }

  const isComplete = typeof args === 'object' || (typeof args === 'string' && args.length > 0);

  return (
    <div className="group rounded-xl border border-warm-border/50 bg-white overflow-hidden hover:border-warm-border transition-colors duration-200">
      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-surface/60 transition-colors duration-200"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn(
          'w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors duration-200',
          isComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500',
        )}>
          {isComplete ? <Check size={11} /> : <Play size={10} className="ml-px" />}
        </div>
        <code className="text-xs text-warm-text font-mono font-medium truncate flex-1">{name}</code>
        <ChevronDown
          size={13}
          className={cn(
            'text-warm-muted opacity-0 group-hover:opacity-100 transition-all duration-200',
            expanded ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      <div className={cn(
        'overflow-hidden transition-all duration-200',
        expanded ? 'max-h-96' : 'max-h-0',
      )}>
        <div className="px-3.5 py-2.5 border-t border-warm-border/40 bg-surface/40">
          <pre className="text-[11px] text-warm-secondary overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
            {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
