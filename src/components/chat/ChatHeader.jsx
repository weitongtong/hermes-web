import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Popover, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useSession } from '@/hooks/useHermesAPI';
import SessionStats from './SessionStats';

function SessionInfoPopover({ sessionId }) {
  const [open, setOpen] = useState(false);
  const { data } = useSession(open ? sessionId : null);

  if (!sessionId) return null;

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      content={
        data?.session ? (
          <Card bordered={false} className="w-[320px] shadow-none">
            <Space direction="vertical" size={6} className="w-full">
              <Typography.Text strong ellipsis>
                {data.session.title || data.session.id}
              </Typography.Text>
              <Typography.Text type="secondary" className="text-[12px]">
                {data.session.model}
                {data.session.source && data.session.source !== 'api_server' && ` · ${data.session.source}`}
                {data.session.started_at && ` · ${new Date(data.session.started_at * 1000).toLocaleString('zh-CN')}`}
              </Typography.Text>
              <SessionStats session={data.session} />
            </Space>
          </Card>
        ) : null
      }
    >
      <Button type="text" size="small" icon={<InfoCircleOutlined />} />
    </Popover>
  );
}

export default function ChatHeader({ sessionId, onNewChat }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-warm-border/30 bg-white px-5">
      <Space size={12} className="min-w-0">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-breathe" />
        <Typography.Title level={5} className="!mb-0 !text-[15px] truncate">
          {sessionId ? '对话中' : '新对话'}
        </Typography.Title>
        {sessionId && (
          <>
            <Tag bordered={false} className="hidden sm:inline-flex font-mono">
              #{sessionId.slice(0, 8)}
            </Tag>
            <SessionInfoPopover sessionId={sessionId} />
          </>
        )}
      </Space>

      <Button type="default" icon={<PlusOutlined />} onClick={onNewChat}>
        <span className="hidden sm:inline">新对话</span>
      </Button>
    </header>
  );
}
