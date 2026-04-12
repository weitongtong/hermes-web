import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions, useSession, useSessionSearch, useDeleteSession } from '@/hooks/useHermesAPI';
import { History, Search, ChevronLeft, MessageSquare, User, Bot, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

function formatTime(epochSeconds) {
  if (!epochSeconds) return '';
  return new Date(epochSeconds * 1000).toLocaleString('zh-CN');
}

function SourceBadge({ source }) {
  if (!source) return null;
  return (
    <span className="inline-block px-1.5 py-px rounded-md text-[10px] bg-surface-overlay text-warm-secondary font-medium">
      {source}
    </span>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索会话..."
        className="w-full bg-white border border-warm-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-warm-text placeholder:text-warm-muted focus:outline-none focus:border-hermes/40 focus:ring-2 focus:ring-hermes/10 transition-all duration-200"
      />
    </div>
  );
}

function SessionItem({ session, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <MessageSquare size={16} className="text-warm-muted group-hover:text-hermes transition-colors duration-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-warm-text truncate font-medium">{session.title || session.id}</p>
          <SourceBadge source={session.source} />
        </div>
        <p className="text-xs text-warm-muted mt-0.5">
          {session.model && <span className="mr-2">{session.model}</span>}
          {formatTime(session.started_at)}
        </p>
      </div>
    </button>
  );
}

function SessionDetail({ id, onBack }) {
  const { data, isLoading } = useSession(id);
  const navigate = useNavigate();
  const deleteSession = useDeleteSession();

  const handleDelete = () => {
    if (!window.confirm('确定删除这个会话吗？删除后无法恢复。')) return;
    deleteSession.mutate(id, { onSuccess: () => onBack() });
  };

  if (isLoading) return <div className="text-sm text-warm-muted animate-pulse">加载中...</div>;
  if (!data) return <div className="text-sm text-warm-muted">会话不存在</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-warm-muted hover:text-warm-text transition-colors duration-200"
        >
          <ChevronLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            <Trash2 size={14} />
            删除
          </button>
          <button
            onClick={() => navigate(`/chat/${encodeURIComponent(id)}`)}
            className="flex items-center gap-1.5 text-xs text-hermes hover:text-hermes-dark transition-colors duration-200 font-medium"
          >
            <ExternalLink size={14} />
            在对话中打开
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-warm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-warm-text">
            {data.session.title || data.session.id}
          </h2>
          <SourceBadge source={data.session.source} />
        </div>
        <p className="text-xs text-warm-muted">
          {data.session.model} &middot; {formatTime(data.session.started_at)}
        </p>
      </div>

      <div className="relative pl-4 border-l-2 border-dashed border-warm-border/60 space-y-4 ml-3">
        {data.messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 animate-fade-in-up relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-warm-border bg-white" />
            <div className={cn(
              'shrink-0 w-7 h-7 rounded-xl flex items-center justify-center',
              msg.role === 'user' ? 'bg-hermes/10' : msg.role === 'assistant' ? 'bg-hermes/8' : 'bg-surface-overlay'
            )}>
              {msg.role === 'user' ? <User size={14} className="text-hermes-dark" /> :
               msg.role === 'assistant' ? <Bot size={14} className="text-hermes" /> :
               <span className="text-[10px] text-warm-muted font-mono">T</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-warm-muted mb-1 font-medium">
                {{ user: '用户', assistant: '助手', tool: '工具', system: '系统' }[msg.role] || msg.role}
                {msg.timestamp && ` · ${new Date(msg.timestamp * 1000).toLocaleTimeString('zh-CN')}`}
              </div>
              {msg.content ? (
                <MarkdownRenderer content={msg.content} className="text-sm" />
              ) : msg.tool_calls ? (
                <pre className="text-xs text-warm-secondary bg-[#F5F2EB] p-3 rounded-xl overflow-x-auto font-mono border border-warm-border/60">{msg.tool_calls}</pre>
              ) : (
                <span className="text-xs text-warm-muted italic">空</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sessions() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { data: sessions, isLoading, isError, error } = useSessions();
  const { data: searchResults } = useSessionSearch(search);

  const displaySessions = search ? null : sessions;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5 animate-fade-in">
        <h1 className="text-2xl font-semibold text-warm-text flex items-center gap-2.5">
          <History size={22} className="text-hermes" /> 会话管理
        </h1>

        {selectedId ? (
          <SessionDetail id={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <SearchBar value={search} onChange={setSearch} />

            {search && searchResults ? (
              <div className="space-y-2">
                <p className="text-xs text-warm-muted font-medium">{searchResults.length} 条结果</p>
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.session_id)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-white shadow-warm hover:shadow-warm-lg transition-all duration-200"
                  >
                    <p className="text-xs text-warm-muted mb-1">{r.role} · {r.title || r.session_id}</p>
                    <p
                      className="text-sm text-warm-text"
                      dangerouslySetInnerHTML={{
                        __html: (r.snippet || '').replace(/>>>/g, '<mark class="bg-hermes/15 text-hermes-dark px-0.5 rounded">').replace(/<<</g, '</mark>'),
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : isLoading ? (
              <div className="text-sm text-warm-muted animate-pulse">加载中...</div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500">加载会话失败</p>
                <p className="text-xs text-warm-muted mt-1">{error?.message || '未知错误'}</p>
              </div>
            ) : !displaySessions?.length ? (
              <div className="text-sm text-warm-muted text-center py-12">暂无会话</div>
            ) : (
              <div className="space-y-2">
                {displaySessions.map((s) => (
                  <SessionItem key={s.id} session={s} onClick={() => setSelectedId(s.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
