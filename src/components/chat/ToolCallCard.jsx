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
    <div className="rounded-lg overflow-hidden text-sm border border-gray-200 bg-white">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <Terminal size={13} className="text-hermes shrink-0" />
        <span className="text-gray-700 font-mono text-xs truncate">{name}</span>
        <span className="ml-auto text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-3 py-2 border-t border-gray-100 bg-surface">
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all font-mono">
            {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
