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
    <span className="inline-block px-1.5 py-px rounded text-[10px] bg-surface-overlay text-gray-500 font-medium">
      {source}
    </span>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索会话..."
        className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-hermes/50 focus:ring-2 focus:ring-hermes/10 transition-all"
      />
    </div>
  );
}

function SessionItem({ session, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border border-gray-100 hover:border-hermes/20 hover:shadow-md hover:shadow-hermes/5 transition-all duration-200 group"
    >
      <div className="w-1 self-stretch rounded-full bg-gray-200 group-hover:bg-hermes/40 transition-colors shrink-0" />
      <MessageSquare size={16} className="text-gray-400 group-hover:text-hermes transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700 truncate font-medium">{session.title || session.id}</p>
          <SourceBadge source={session.source} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
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

  if (isLoading) return <div className="text-sm text-gray-400 animate-pulse">加载中...</div>;
  if (!data) return <div className="text-sm text-gray-400">会话不存在</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors font-medium disabled:opacity-50"
          >
            <Trash2 size={14} />
            删除
          </button>
          <button
            onClick={() => navigate(`/chat/${encodeURIComponent(id)}`)}
            className="flex items-center gap-1.5 text-xs text-hermes hover:text-hermes-light transition-colors font-medium"
          >
            <ExternalLink size={14} />
            在 Chat 中打开
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm shadow-gray-200/50">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-800">
            {data.session.title || data.session.id}
          </h2>
          <SourceBadge source={data.session.source} />
        </div>
        <p className="text-xs text-gray-400">
          {data.session.model} &middot; {formatTime(data.session.started_at)}
        </p>
      </div>

      <div className="space-y-3">
        {data.messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 animate-fade-in-up">
            <div className={cn(
              'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5',
              msg.role === 'user' ? 'bg-hermes/10' : msg.role === 'assistant' ? 'bg-hermes/10' : 'bg-surface-overlay'
            )}>
              {msg.role === 'user' ? <User size={14} className="text-hermes-dark" /> :
               msg.role === 'assistant' ? <Bot size={14} className="text-hermes" /> :
               <span className="text-[10px] text-gray-400 font-mono">T</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 mb-1 font-medium">
                {{ user: '用户', assistant: '助手', tool: '工具', system: '系统' }[msg.role] || msg.role}
                {msg.timestamp && ` · ${new Date(msg.timestamp * 1000).toLocaleTimeString('zh-CN')}`}
              </div>
              {msg.content ? (
                <MarkdownRenderer content={msg.content} className="text-sm" />
              ) : msg.tool_calls ? (
                <pre className="text-xs text-gray-600 bg-surface-overlay/80 p-3 rounded-lg overflow-x-auto font-mono border border-gray-200/60">{msg.tool_calls}</pre>
              ) : (
                <span className="text-xs text-gray-400 italic">空</span>
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
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <History size={22} className="text-hermes" /> 会话管理
        </h1>

        {selectedId ? (
          <SessionDetail id={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            <SearchBar value={search} onChange={setSearch} />

            {search && searchResults ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">{searchResults.length} 条结果</p>
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.session_id)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white border border-gray-100 hover:border-hermes/20 hover:shadow-md transition-all duration-200"
                  >
                    <p className="text-xs text-gray-400 mb-1">{r.role} · {r.title || r.session_id}</p>
                    <p
                      className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: (r.snippet || '').replace(/>>>/g, '<mark class="bg-hermes/15 text-hermes-dark px-0.5 rounded">').replace(/<<</g, '</mark>'),
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : isLoading ? (
              <div className="text-sm text-gray-400 animate-pulse">加载中...</div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500">加载会话失败</p>
                <p className="text-xs text-gray-400 mt-1">{error?.message || '未知错误'}</p>
              </div>
            ) : !displaySessions?.length ? (
              <div className="text-sm text-gray-400 text-center py-12">暂无会话</div>
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
