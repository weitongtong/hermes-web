import {
  ApiOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Card, Col, Empty, Progress, Row, Skeleton, Space, Statistic, Typography } from 'antd';
import { useJobs, useStatus } from '@/hooks/useHermesAPI';

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <Card bordered={false} className="h-full shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Typography.Text type="secondary" className="text-[11px] font-semibold uppercase tracking-[0.18em]">
            {label}
          </Typography.Text>
          <Statistic value={value ?? '-'} valueStyle={{ fontSize: 24, color: '#1a1a1e', lineHeight: 1.2 }} />
          {sub ? (
            <Typography.Paragraph type="secondary" className="!mb-0 !mt-1 text-[12px]">
              {sub}
            </Typography.Paragraph>
          ) : null}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: `${accent}14`, color: accent }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function UsageBar({ label, current, limit, unit = '字符' }) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const warn = pct > 80;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text type="secondary">
          {current.toLocaleString()} / {limit.toLocaleString()} {unit}
        </Typography.Text>
      </div>
      <Progress
        percent={Number(pct.toFixed(0))}
        showInfo={false}
        strokeColor={warn ? '#f59e0b' : '#dc2626'}
        trailColor="#f1f3f5"
      />
    </div>
  );
}

export default function Dashboard() {
  const { data: status, isLoading } = useStatus();
  const { data: jobsData } = useJobs();

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="mx-auto max-w-6xl p-6">
          <Space direction="vertical" className="w-full" size={16}>
            <Skeleton.Input active block className="!h-10 !w-56" />
            <Row gutter={[16, 16]}>
              {[...Array(5)].map((_, index) => (
                <Col xs={24} sm={12} lg={8} xl={24 / 5} key={index}>
                  <Card bordered={false} className="shadow-warm">
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Row gutter={[16, 16]}>
              {[...Array(2)].map((_, index) => (
                <Col xs={24} lg={12} key={index}>
                  <Card bordered={false} className="shadow-warm">
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        </div>
      </div>
    );
  }

  const model = status?.model || {};
  const platforms = status?.platforms || [];
  const memory = status?.memory || {};
  const jobs = jobsData?.jobs || [];
  const activeJobs = jobs.filter((job) => job.enabled && job.state !== 'paused').length;
  const pausedJobs = jobs.filter((job) => !job.enabled || job.state === 'paused').length;

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-6xl p-6">
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Space align="center" size={12}>
              <DashboardOutlined className="text-[22px] text-hermes" />
              <Typography.Title level={2} className="!mb-0">
                仪表盘
              </Typography.Title>
            </Space>
            <Typography.Paragraph type="secondary" className="!mb-0 !mt-2">
              Hermes Agent 系统状态概览
            </Typography.Paragraph>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8} xl={24 / 5}>
              <StatCard
                icon={<RobotOutlined className="text-[20px]" />}
                label="模型"
                value={model.default || '未设置'}
                sub={model.provider ? `提供方：${model.provider}` : ''}
                accent="#dc2626"
              />
            </Col>
            <Col xs={24} sm={12} lg={8} xl={24 / 5}>
              <StatCard
                icon={<ApiOutlined className="text-[20px]" />}
                label="平台"
                value={platforms.length}
                sub={platforms.map((platform) => platform.name).join('、') || '无'}
                accent="#2563eb"
              />
            </Col>
            <Col xs={24} sm={12} lg={8} xl={24 / 5}>
              <StatCard
                icon={<DatabaseOutlined className="text-[20px]" />}
                label="记忆"
                value={`${(memory.memoryChars || 0) + (memory.userChars || 0)}`}
                sub="字符"
                accent="#059669"
              />
            </Col>
            <Col xs={24} sm={12} lg={8} xl={24 / 5}>
              <StatCard
                icon={<ToolOutlined className="text-[20px]" />}
                label="技能"
                value={status?.skillCount ?? 0}
                sub="已安装"
                accent="#7c3aed"
              />
            </Col>
            <Col xs={24} sm={12} lg={8} xl={24 / 5}>
              <StatCard
                icon={<ClockCircleOutlined className="text-[20px]" />}
                label="定时任务"
                value={jobs.length}
                sub={pausedJobs > 0 ? `${activeJobs} 活跃 / ${pausedJobs} 已暂停` : `${activeJobs} 活跃`}
                accent="#d97706"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card bordered={false} className="h-full shadow-warm" title="记忆用量">
                <Space direction="vertical" className="w-full" size={20}>
                  <UsageBar label="MEMORY.md" current={memory.memoryChars || 0} limit={memory.memoryLimit || 2200} />
                  <UsageBar label="USER.md" current={memory.userChars || 0} limit={memory.userLimit || 1375} />
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card bordered={false} className="h-full shadow-warm" title="平台状态">
                {!platforms.length ? (
                  <Empty description="暂无已配置的平台" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Space direction="vertical" className="w-full" size={12}>
                    {platforms.map((platform) => (
                      <div
                        key={platform.name}
                        className="flex items-center justify-between rounded-2xl border border-warm-border/40 bg-surface-overlay/30 px-4 py-3"
                      >
                        <Space size={10}>
                          <CheckCircleFilled className={platform.enabled ? 'text-emerald-500' : 'text-warm-muted'} />
                          <Typography.Text>{platform.name}</Typography.Text>
                        </Space>
                        <Typography.Text type={platform.enabled ? undefined : 'secondary'}>
                          {platform.enabled ? '已启用' : '已禁用'}
                        </Typography.Text>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  );
}
