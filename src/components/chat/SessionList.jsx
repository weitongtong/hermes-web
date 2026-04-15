import { CloseCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Skeleton, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeleteSession, useSessionSearch, useSessions } from '@/hooks/useHermesAPI';
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
      className={`w-full rounded-2xl px-3 py-2 text-left transition-colors ${isActive ? 'bg-black/[0.03]' : 'bg-transparent hover:bg-black/[0.02]'}`}
    >
      <Typography.Text strong={isActive} ellipsis className="block">
        {result.title || result.session_id}
      </Typography.Text>
      <Typography.Paragraph
        className="!mb-0 !mt-1 !text-[12px] text-warm-muted"
        ellipsis={{ rows: 2 }}
        dangerouslySetInnerHTML={{ __html: highlightSnippet(bestSnippet) }}
      />
      {result.snippets.length > 1 && (
        <Typography.Text type="secondary" className="mt-1 inline-block text-[11px]">
          +{result.snippets.length - 1} 条匹配
        </Typography.Text>
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

  const localFiltered = search && !useFts
    ? sessions?.filter((s) => (s.title || s.id).toLowerCase().includes(search.toLowerCase()))
    : !search ? sessions : null;

  const groups = localFiltered ? groupByDate(localFiltered) : [];
  const ftsGroups = useFts && searchResults ? groupSearchResults(searchResults) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <Typography.Text type="secondary" className="text-[12px] font-semibold uppercase tracking-[0.18em]">
          对话
        </Typography.Text>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => navigate('/chat')} />
      </div>

      <Input
        allowClear={{ clearIcon: <CloseCircleFilled /> }}
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索..."
        className="mb-3"
      />

      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <Space direction="vertical" className="w-full" size={8}>
            {[...Array(5)].map((_, i) => (
              <Skeleton.Button key={i} active block className="!h-16 !rounded-2xl" />
            ))}
          </Space>
        ) : isError ? (
          <Empty
            description={error?.message || '加载失败'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : useFts ? (
          isFtsLoading || debouncedSearch !== search ? (
            <Space direction="vertical" className="w-full" size={8}>
              {[...Array(3)].map((_, i) => (
                <Skeleton.Button key={i} active block className="!h-16 !rounded-2xl" />
              ))}
            </Space>
          ) : !ftsGroups?.length ? (
            <Empty description="没有匹配的对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space direction="vertical" className="w-full" size={4}>
              <Typography.Text type="secondary" className="px-1 text-[11px]">
                {searchResults.length} 条匹配 · {ftsGroups.length} 个会话
              </Typography.Text>
              {ftsGroups.map((result) => (
                <SearchResultItem
                  key={result.session_id}
                  result={result}
                  isActive={activeId === result.session_id}
                  onSelect={handleSelect}
                />
              ))}
            </Space>
          )
        ) : groups.length === 0 ? (
          <Empty description={search ? '没有匹配的对话' : '暂无对话'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" className="w-full" size={12}>
            {groups.map((group) => (
              <div key={group.label}>
                <Typography.Text type="secondary" className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {group.label}
                </Typography.Text>
                <Space direction="vertical" className="mt-2 w-full" size={6}>
                  {group.items.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeId === session.id}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </Space>
              </div>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
}
