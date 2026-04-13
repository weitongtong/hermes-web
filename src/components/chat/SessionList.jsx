import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useSessions, useDeleteSession } from '@/hooks/useHermesAPI';
import { cn } from '@/lib/cn';
import SessionItem from './SessionItem';

function groupByDate(sessions) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const yesterday = today - 86400;
  const weekAgo = today - 86400 * 7;

  const groups = { today: [], yesterday: [], week: [], older: [] };

  for (const s of sessions) {
    const t = s.started_at || 0;
    if (t >= today) groups.today.push(s);
    else if (t >= yesterday) groups.yesterday.push(s);
    else if (t >= weekAgo) groups.week.push(s);
    else groups.older.push(s);
  }

  return [
    { label: '今天', items: groups.today },
    { label: '昨天', items: groups.yesterday },
    { label: '过去 7 天', items: groups.week },
    { label: '更早', items: groups.older },
  ].filter((g) => g.items.length > 0);
}

export default function SessionList({ onNewChat }) {
  const [search, setSearch] = useState('');
  const { sessionId: activeId } = useParams();
  const navigate = useNavigate();
  const { data: sessions, isLoading, isError, error } = useSessions(50);
  const deleteSession = useDeleteSession();

  const handleSelect = (id) => navigate(`/chat/${encodeURIComponent(id)}`);

  const handleDelete = (id) => {
    deleteSession.mutate(id, {
      onSuccess: () => {
        if (activeId === id) onNewChat?.();
      },
    });
  };

  const filtered = search
    ? sessions?.filter((s) => (s.title || s.id).toLowerCase().includes(search.toLowerCase()))
    : sessions;

  const groups = filtered ? groupByDate(filtered) : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-xs font-semibold text-warm-muted uppercase tracking-wider">对话</span>
        <button
          onClick={onNewChat}
          className="p-1 rounded-md text-warm-muted hover:text-hermes hover:bg-hermes/6 transition-colors duration-150"
          title="新建对话"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索..."
            className="w-full bg-surface-overlay/60 border-none rounded-lg pl-8 pr-8 py-1.5 text-xs text-warm-text placeholder:text-warm-muted/50 focus:outline-none focus:ring-1 focus:ring-hermes/20 focus:bg-white transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-muted hover:text-warm-text"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {isLoading ? (
          <div className="space-y-2 px-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface-overlay/40 animate-shimmer" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-xs text-center py-8 px-3">
            <p className="text-red-400 font-medium">加载失败</p>
            <p className="text-warm-muted mt-1 break-all">{error?.message || '未知错误'}</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-warm-muted">
            <p className="text-xs">{search ? '没有匹配的对话' : '暂无对话'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className={cn(
                  'px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-warm-muted/60',
                  search && 'hidden',
                )}>
                  {group.label}
                </p>
                <div className="space-y-px">
                  {group.items.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      isActive={activeId === s.id}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
