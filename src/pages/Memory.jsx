import { FileTextOutlined, InfoCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Badge, Card, Empty, Progress, Segmented, Skeleton, Space, Typography } from 'antd';
import { useState } from 'react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { useMemory } from '@/hooks/useHermesAPI';

export default function Memory() {
  const [tab, setTab] = useState('memory');
  const { data, isLoading } = useMemory(tab);

  const tabOptions = [
    {
      label: (
        <Space size={6}>
          <RobotOutlined />
          <span>Agent 记忆</span>
        </Space>
      ),
      value: 'memory',
    },
    {
      label: (
        <Space size={6}>
          <FileTextOutlined />
          <span>用户画像</span>
        </Space>
      ),
      value: 'user',
    },
  ];

  const percent = data?.charLimit ? Math.min((data.charCount / data.charLimit) * 100, 100) : 0;

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-5xl p-6">
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Space align="center" size={12}>
              <RobotOutlined className="text-[22px] text-hermes" />
              <Typography.Title level={2} className="!mb-0">
                记忆
              </Typography.Title>
            </Space>
          </div>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="记忆条目为只读"
            description="如需修改，请通过对话让 Hermes 更新其记忆。"
          />

          <Card bordered={false} className="shadow-warm">
            <Space direction="vertical" size={18} className="w-full">
              <Segmented options={tabOptions} value={tab} onChange={setTab} />

              {data ? (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Typography.Text>
                      {tab === 'memory' ? 'MEMORY.md' : 'USER.md'}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {data.charCount.toLocaleString()} / {data.charLimit.toLocaleString()} 字符
                    </Typography.Text>
                  </div>
                  <Progress
                    percent={Number(percent.toFixed(0))}
                    strokeColor={percent > 80 ? '#f59e0b' : '#dc2626'}
                    trailColor="#f1f3f5"
                  />
                </div>
              ) : null}
            </Space>
          </Card>

          {isLoading ? (
            <Space direction="vertical" className="w-full" size={16}>
              {[...Array(3)].map((_, index) => (
                <Card key={index} bordered={false} className="shadow-warm">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              ))}
            </Space>
          ) : !data?.entries.length ? (
            <Card bordered={false} className="shadow-warm">
              <Empty description="暂无记忆条目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : (
            <Space direction="vertical" className="w-full" size={16}>
              {data.entries.map((entry, index) => (
                <Card
                  key={index}
                  bordered={false}
                  className="shadow-warm"
                  title={<Badge count={index + 1} color="#dc2626" />}
                >
                  <MarkdownRenderer content={entry} />
                </Card>
              ))}
            </Space>
          )}
        </Space>
      </div>
    </div>
  );
}
