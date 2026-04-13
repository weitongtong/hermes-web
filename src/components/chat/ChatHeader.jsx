import { Plus } from 'lucide-react';

export default function ChatHeader({ sessionId, onNewChat }) {
  return (
    <header className="h-12 bg-white/90 backdrop-blur-xl flex items-center gap-3 px-5 shrink-0 border-b border-warm-border/30 z-10">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-breathe" />
        <h1 className="text-[13px] font-medium text-warm-text truncate">
          {sessionId ? '对话中' : '新对话'}
        </h1>
        {sessionId && (
          <span className="text-[10px] text-warm-muted/60 font-mono truncate hidden sm:inline">
            #{sessionId.slice(0, 8)}
          </span>
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
