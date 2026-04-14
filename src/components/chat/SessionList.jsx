import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useSessions, useDeleteSession, useSessionSearch } from '@/hooks/useHermesAPI';
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

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function groupSearchResults(results) {
  const map = new Map();
  for (const r of results) {
    if (!map.has(r.session_id)) {
      map.set(r.session_id, { session_id: r.session_id, title: r.title, model: r.model, snippets: [] });
    }
    map.get(r.session_id).snippets.push(r.snippet);
  }
  return [...map.values()];
}

function highlightSnippet(snippet) {
  return (snippet || '')
    .replace(/>>>/g, '<mark class="bg-hermes/15 text-hermes-dark rounded px-px">')
    .replace(/<<</g, '</mark>');
}

function SearchResultItem({ result, isActive, onSelect }) {
  const bestSnippet = result.snippets[0] || '';
  return (
    <button
      onClick={() => onSelect(result.session_id)}
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg transition-all duration-150 group relative',
        isActive ? 'bg-black/[0.025]' : 'hover:bg-black/[0.02]',
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-hermes" />
      )}
      <div className="text-[13px] truncate pr-2 leading-snug text-warm-text">
        {result.title || result.session_id}
      </div>
      <p
        className="mt-0.5 text-[11px] text-warm-muted line-clamp-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightSnippet(bestSnippet) }}
      />
      {result.snippets.length > 1 && (
        <span className="text-[10px] text-warm-muted/60 mt-0.5 inline-block">
          +{result.snippets.length - 1} 条匹配
        </span>
      )}
    </button>
  );
}

export default function SessionList() {
  const [search, setSearch] = useState('');
  const { pathname } = useLocation();
  const activeId = pathname.startsWith('/chat/') ? decodeURIComponent(pathname.slice(6)) : null;
  const navigate = useNavigate();
  const { data: sessions, isLoading, isError, error } = useSessions(50);
  const deleteSession = useDeleteSession();

  const useFts = search.length > 2;
  const debouncedSearch = useDebounce(useFts ? search : '', 300);
  const { data: searchResults, isFetching: isFtsLoading } = useSessionSearch(debouncedSearch);

  const handleSelect = (id) => navigate(`/chat/${encodeURIComponent(id)}`);

  const handleDelete = (id) => {
    deleteSession.mutate(id, {
      onSuccess: () => {
        if (activeId === id) navigate('/chat');
      },
    });
  };

  const localFiltered = (search && !useFts)
    ? sessions?.filter((s) => (s.title || s.id).toLowerCase().includes(search.toLowerCase()))
    : (!search ? sessions : null);

  const groups = localFiltered ? groupByDate(localFiltered) : [];
  const ftsGroups = (useFts && searchResults) ? groupSearchResults(searchResults) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-xs font-semibold text-warm-muted uppercase tracking-wider">对话</span>
        <button
          onClick={() => navigate('/chat')}
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
        ) : useFts ? (
          isFtsLoading || (debouncedSearch !== search) ? (
            <div className="space-y-2 px-2 pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-overlay/40 animate-shimmer" />
              ))}
            </div>
          ) : !ftsGroups?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-warm-muted">
              <p className="text-xs">没有匹配的对话</p>
            </div>
          ) : (
            <div className="space-y-px">
              <p className="px-3 pt-1 pb-2 text-[10px] text-warm-muted/60">
                {searchResults.length} 条匹配 · {ftsGroups.length} 个会话
              </p>
              {ftsGroups.map((r) => (
                <SearchResultItem
                  key={r.session_id}
                  result={r}
                  isActive={activeId === r.session_id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )
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
