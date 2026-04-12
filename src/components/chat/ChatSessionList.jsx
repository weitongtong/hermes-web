import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, MessageSquare, PanelLeftClose, PanelLeft, Trash2 } from 'lucide-react';
import { useSessions, useDeleteSession } from '@/hooks/useHermesAPI';
import { cn } from '@/lib/cn';

const LS_KEY = 'hermes-chat-panel-collapsed';

function getCollapsed() {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
}

export default function ChatSessionList({ resetChat }) {
  const [collapsed, setCollapsed] = useState(getCollapsed);
  const [search, setSearch] = useState('');
  const { sessionId: activeId } = useParams();
  const navigate = useNavigate();
  const { data: sessions, isLoading, isError, error } = useSessions(50);
  const deleteSession = useDeleteSession();

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('确定删除这个对话吗？删除后无法恢复。')) return;
    deleteSession.mutate(id, {
      onSuccess: () => {
        if (activeId === id) {
          resetChat?.();
          navigate('/chat');
        }
      },
    });
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(LS_KEY, next ? '1' : '0'); } catch {}
  };

  const filtered = search
    ? sessions?.filter((s) => {
        const q = search.toLowerCase();
        return (s.title || s.id).toLowerCase().includes(q);
      })
    : sessions;

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 bg-surface-overlay/40 flex flex-col items-center py-3 gap-2 shadow-[1px_0_8px_rgba(0,0,0,0.03)]">
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-xl text-warm-muted hover:text-warm-text hover:bg-white transition-colors duration-200"
          title="展开会话列表"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="p-2 rounded-xl text-warm-muted hover:text-hermes hover:bg-hermes/6 transition-colors duration-200"
          title="新建对话"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 bg-surface-overlay/40 flex flex-col shadow-[1px_0_8px_rgba(0,0,0,0.03)]">
      <div className="h-13 flex items-center justify-between px-3 border-b border-warm-border/50 shrink-0">
        <span className="text-sm font-medium text-warm-text">对话</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate('/chat')}
            className="p-1.5 rounded-lg text-warm-muted hover:text-hermes hover:bg-hermes/6 transition-colors duration-200"
            title="新建对话"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-warm-muted hover:text-warm-secondary hover:bg-surface-overlay transition-colors duration-200"
            title="收起会话列表"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话..."
            className="w-full bg-white border border-warm-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-warm-text placeholder:text-warm-muted focus:outline-none focus:border-hermes/40 focus:ring-1 focus:ring-hermes/10 transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {isLoading ? (
          <div className="text-xs text-warm-muted text-center py-8 animate-pulse">加载中...</div>
        ) : isError ? (
          <div className="text-xs text-center py-8 px-3">
            <p className="text-red-500">加载失败</p>
            <p className="text-warm-muted mt-1 break-all">{error?.message || '未知错误'}</p>
          </div>
        ) : !filtered?.length ? (
          <div className="text-xs text-warm-muted text-center py-8">
            {search ? '无匹配结果' : '暂无对话'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/chat/${encodeURIComponent(s.id)}`)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  activeId === s.id
                    ? 'bg-hermes/8 text-hermes-dark font-medium'
                    : 'text-warm-secondary hover:bg-hermes/4'
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className={cn(
                    'shrink-0',
                    activeId === s.id ? 'text-hermes' : 'text-warm-muted'
                  )} />
                  <span className="text-sm truncate flex-1">
                    {s.title || s.id.slice(0, 12) + '...'}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(e, s.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(e, s.id); }}
                    className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-warm-muted hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="删除对话"
                  >
                    <Trash2 size={13} />
                  </span>
                </div>
                <div className="ml-[22px] mt-0.5 flex items-center gap-2 text-[11px] text-warm-muted">
                  {s.source && s.source !== 'api_server' && (
                    <span className="px-1 py-px rounded bg-surface-overlay text-warm-secondary text-[10px]">{s.source}</span>
                  )}
                  {s.started_at && (
                    <span>{new Date(s.started_at * 1000).toLocaleDateString('zh-CN')}</span>
                  )}
                  {s.message_count != null && <span>{s.message_count} 条</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
