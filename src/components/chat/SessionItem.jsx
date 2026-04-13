import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTokenCount, formatRelativeTime } from '@/lib/format';

function getDisplayTitle(session) {
  if (session.title) return session.title;
  if (session.model) return `${session.model} 对话`;
  if (session.started_at) {
    const d = new Date(session.started_at * 1000);
    return `对话 · ${d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
  }
  return '新对话';
}

function MetaDot() {
  return <span className="text-warm-border">·</span>;
}

export default function SessionItem({ session, isActive, onSelect, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (!window.confirm('确定删除这个对话吗？删除后无法恢复。')) return;
    onDelete(session.id);
  };

  const title = getDisplayTitle(session);
  const time = formatRelativeTime(session.started_at);
  const totalTokens = (session.input_tokens || 0) + (session.output_tokens || 0);

  const metaParts = [
    time,
    session.message_count != null && `${session.message_count} 条`,
    totalTokens > 0 && formatTokenCount(totalTokens),
  ].filter(Boolean);

  return (
    <button
      onClick={() => onSelect(session.id)}
      title={session.id}
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg transition-all duration-150 group relative',
        isActive ? 'bg-black/[0.025]' : 'hover:bg-black/[0.02]',
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-hermes" />
      )}

      <span
        role="button"
        tabIndex={0}
        onClick={handleDelete}
        onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(e); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 text-warm-muted hover:text-red-500 hover:bg-red-50/80 transition-all duration-150 z-10"
        title="删除"
      >
        <Trash2 size={12} />
      </span>

      <div className={cn(
        'text-[13px] truncate pr-6 leading-snug',
        isActive ? 'text-warm-text font-semibold' : 'text-warm-text',
      )}>
        {title}
      </div>

      {metaParts.length > 0 && (
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-warm-muted">
          {session.source && session.source !== 'api_server' && (
            <>
              <span className="px-1 py-px rounded bg-surface-overlay text-warm-secondary text-[10px] font-medium">
                {session.source}
              </span>
              <MetaDot />
            </>
          )}
          {metaParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <MetaDot />}
              {part}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
