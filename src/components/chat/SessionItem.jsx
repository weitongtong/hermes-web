import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Popconfirm, Space, Tag, Typography } from 'antd';
import { formatTokenCount, formatRelativeTime } from '@/lib/format';
import { stripThinking } from '@/lib/strip-thinking';

function cleanSessionTitle(title) {
  if (!title) return null;

  const { display } = stripThinking(title);
  let cleaned = (display || title)
    .replace(/<\/?(?:think|thinking|reasoning|thought|REASONING_SCRATCHPAD)[^>]*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = cleaned.toLowerCase();
  if (lower.startsWith('the user is asking') || lower.startsWith('the user wants')) {
    const quoted = cleaned.match(/["“](.+?)["”]/);
    cleaned = quoted?.[1]?.trim() || '';
  }

  return cleaned || null;
}

function getDisplayTitle(session) {
  const cleanedTitle = cleanSessionTitle(session.title);
  if (cleanedTitle) return cleanedTitle;
  if (session.model) return `${session.model} 对话`;
  if (session.started_at) {
    const d = new Date(session.started_at * 1000);
    return `对话 · ${d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
  }
  return '新对话';
}

export default function SessionItem({ session, isActive, onSelect, onDelete }) {
  const title = getDisplayTitle(session);
  const time = formatRelativeTime(session.started_at);
  const totalTokens = (session.input_tokens || 0) + (session.output_tokens || 0);

  const metaParts = [
    time,
    session.message_count != null && `${session.message_count} 条`,
    totalTokens > 0 && formatTokenCount(totalTokens),
  ].filter(Boolean);

  return (
    <Card
      size="small"
      hoverable
      bordered={false}
      onClick={() => onSelect(session.id)}
      className={isActive ? 'bg-black/[0.03]' : 'bg-transparent'}
      styles={{ body: { padding: '10px 12px' } }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Typography.Text strong={isActive} ellipsis className="block">
            {title}
          </Typography.Text>
          <Space size={6} wrap className="mt-2">
            {session.source && session.source !== 'api_server' && (
              <Tag bordered={false}>{session.source}</Tag>
            )}
            {metaParts.map((part) => (
              <Typography.Text key={part} type="secondary" className="text-[11px]">
                {part}
              </Typography.Text>
            ))}
          </Space>
        </div>

        <Popconfirm
          title="确定删除这个对话吗？"
          description="删除后无法恢复。"
          okText="删除"
          cancelText="取消"
          onConfirm={(e) => {
            e?.stopPropagation?.();
            onDelete(session.id);
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </div>
    </Card>
  );
}
