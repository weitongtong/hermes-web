import { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ToolCallCard({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  const name = toolCall?.function?.name || toolCall?.name || 'tool';
  let args = toolCall?.function?.arguments || toolCall?.arguments || '';
  if (typeof args === 'string') {
    try { args = JSON.parse(args); } catch { /* keep as string */ }
  }

  return (
    <div className="rounded-xl overflow-hidden text-sm border border-warm-border bg-white shadow-warm">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-overlay/40 hover:bg-surface-overlay transition-colors duration-200 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <Terminal size={13} className="text-hermes shrink-0" />
        <span className="text-hermes-dark font-mono text-xs truncate font-medium">{name}</span>
        <span className="ml-auto text-warm-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-3 py-2 border-t border-warm-border/60 bg-surface">
          <pre className="text-xs text-warm-secondary overflow-x-auto whitespace-pre-wrap break-all font-mono">
            {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
