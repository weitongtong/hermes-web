import { useState, useRef, useEffect } from 'react';
import { Plus, Info } from 'lucide-react';
import { useSession } from '@/hooks/useHermesAPI';
import SessionStats from './SessionStats';

function SessionInfoPopover({ sessionId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useSession(open ? sessionId : null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-md text-warm-muted/50 hover:text-warm-muted transition-colors duration-150"
        title="会话详情"
      >
        <Info size={14} />
      </button>
      {open && data?.session && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-warm-lg border border-warm-border/30 p-4 z-50 animate-fade-in">
          <div className="mb-3">
            <p className="text-sm font-medium text-warm-text truncate">
              {data.session.title || data.session.id}
            </p>
            <p className="text-[11px] text-warm-muted mt-0.5">
              {data.session.model}
              {data.session.source && data.session.source !== 'api_server' && ` · ${data.session.source}`}
              {data.session.started_at && ` · ${new Date(data.session.started_at * 1000).toLocaleString('zh-CN')}`}
            </p>
          </div>
          <SessionStats session={data.session} />
        </div>
      )}
    </div>
  );
}

export default function ChatHeader({ sessionId, onNewChat }) {
  return (
    <header className="h-12 bg-white/90 backdrop-blur-xl flex items-center gap-3 px-5 shrink-0 border-b border-warm-border/30 z-10">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-breathe" />
        <h1 className="text-[13px] font-medium text-warm-text truncate">
          {sessionId ? '对话中' : '新对话'}
        </h1>
        {sessionId && (
          <>
            <span className="text-[10px] text-warm-muted/60 font-mono truncate hidden sm:inline">
              #{sessionId.slice(0, 8)}
            </span>
            <SessionInfoPopover sessionId={sessionId} />
          </>
        )}
      </div>

      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warm-secondary hover:text-hermes bg-surface-overlay/50 hover:bg-hermes/6 rounded-lg border border-transparent hover:border-hermes/15 transition-all duration-200"
      >
        <Plus size={13} strokeWidth={2.5} />
        <span className="hidden sm:inline">新对话</span>
      </button>
    </header>
  );
}
