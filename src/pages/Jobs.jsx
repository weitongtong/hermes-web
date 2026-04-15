import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import {
  useChannels,
  useCreateJob,
  useDeleteJob,
  useJobs,
  usePauseJob,
  useResumeJob,
  useRunJob,
  useStatus,
  useUpdateJob,
} from '@/hooks/useHermesAPI';

const { TextArea } = Input;

const STATE_MAP = {
  scheduled: { label: '已调度', color: 'success' },
  paused: { label: '已暂停', color: 'default' },
  running: { label: '运行中', color: 'processing' },
  completed: { label: '已完成', color: 'purple' },
  error: { label: '错误', color: 'error' },
};

const PLATFORM_LABELS = {
  local: '本地',
  origin: '来源平台',
  feishu: '飞书',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  wecom: '企业微信',
  dingtalk: '钉钉',
  matrix: 'Matrix',
  email: '邮件',
  webhook: 'Webhook',
};

const CHANNEL_TYPE_LABELS = {
  group: '群组',
  dm: '私聊',
  channel: '频道',
  user: '用户',
};

const CRON_PRESETS = [
  { label: '每小时', value: '0 * * * *' },
  { label: '每天 9:00', value: '0 9 * * *' },
  { label: '每周一 9:00', value: '0 9 * * 1' },
  { label: '每月 1 日', value: '0 0 1 * *' },
];

const UNIT_OPTIONS = [
  { value: 'm', label: '分钟' },
  { value: 'h', label: '小时' },
  { value: 'd', label: '天' },
];

function StateBadge({ state }) {
  const item = STATE_MAP[state] || { label: state, color: 'default' };
  return <Tag color={item.color}>{item.label}</Tag>;
}

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN');
}

function formatDeliverTarget(deliver) {
  if (!deliver || deliver === 'local') return PLATFORM_LABELS.local;
  const idx = deliver.indexOf(':');
  if (idx > 0) {
    const platform = deliver.slice(0, idx);
    const channel = deliver.slice(idx + 1);
    return `${PLATFORM_LABELS[platform] || platform} · ${channel}`;
  }
  return PLATFORM_LABELS[deliver] || deliver;
}

function initScheduleFromJob(schedule) {
  const base = {
    tab: 'once',
    onceMode: 'delay',
    delayNum: null,
    delayUnit: 'm',
    datetime: '',
    intervalNum: null,
    intervalUnit: 'm',
    cronExpr: '',
  };

  if (!schedule || typeof schedule !== 'object' || !schedule.kind) return base;

  if (schedule.kind === 'once' && schedule.run_at) {
    const runAt = new Date(schedule.run_at);
    if (runAt > new Date()) {
      const local = new Date(runAt.getTime() - runAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      return { ...base, onceMode: 'datetime', datetime: local };
    }
    return base;
  }

  if (schedule.kind === 'interval' && schedule.minutes) {
    const minutes = schedule.minutes;
    if (minutes % 1440 === 0) return { ...base, tab: 'interval', intervalNum: minutes / 1440, intervalUnit: 'd' };
    if (minutes % 60 === 0) return { ...base, tab: 'interval', intervalNum: minutes / 60, intervalUnit: 'h' };
    return { ...base, tab: 'interval', intervalNum: minutes, intervalUnit: 'm' };
  }

  if (schedule.kind === 'cron' && schedule.expr) {
    return { ...base, tab: 'cron', cronExpr: schedule.expr };
  }

  return base;
}

function initDeliverFromJob(deliver) {
  if (!deliver || deliver === 'local') return { platform: 'local', channel: '' };
  const idx = deliver.indexOf(':');
  if (idx > 0) return { platform: deliver.slice(0, idx), channel: deliver.slice(idx + 1) };
  return { platform: deliver, channel: '' };
}

function PageShell({ title, extra, children }) {
  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-5xl p-6">
        <Space direction="vertical" size={20} className="w-full">
          <div className="flex items-start justify-between gap-4">
            <Space align="center" size={12}>
              <ClockCircleOutlined className="text-[22px] text-hermes" />
              <Typography.Title level={2} className="!mb-0">
                {title}
              </Typography.Title>
            </Space>
            {extra}
          </div>
          {children}
        </Space>
      </div>
    </div>
  );
}

function JobForm({ job, onSubmit, onCancel, isSubmitting }) {
  const { data: channelsData } = useChannels();
  const { data: statusData } = useStatus();

  const sched = initScheduleFromJob(job?.schedule);
  const deliver = initDeliverFromJob(job?.deliver);

  const [name, setName] = useState(job?.name || '');
  const [prompt, setPrompt] = useState(job?.prompt || '');
  const [repeat, setRepeat] = useState(job?.repeat?.times ?? null);
  const [model, setModel] = useState(job?.model || '');

  const [scheduleTab, setScheduleTab] = useState(sched.tab);
  const [onceMode, setOnceMode] = useState(sched.onceMode);
  const [delayNum, setDelayNum] = useState(sched.delayNum);
  const [delayUnit, setDelayUnit] = useState(sched.delayUnit);
  const [datetime, setDatetime] = useState(sched.datetime);
  const [intervalNum, setIntervalNum] = useState(sched.intervalNum);
  const [intervalUnit, setIntervalUnit] = useState(sched.intervalUnit);
  const [cronExpr, setCronExpr] = useState(sched.cronExpr);

  const [platform, setPlatform] = useState(deliver.platform);
  const [channel, setChannel] = useState(deliver.channel);
  const [showDeliverHelp, setShowDeliverHelp] = useState(false);

  const platforms = channelsData?.platforms || {};
  const platformKeys = Object.keys(platforms);
  const availablePlatforms = platform !== 'local' && !platformKeys.includes(platform)
    ? [platform, ...platformKeys]
    : platformKeys;
  const selectedChannels = platform !== 'local' ? platforms[platform] || [] : [];
  const hasChannelList = selectedChannels.length > 0;
  const defaultModel = statusData?.model?.default || '';

  const buildSchedule = () => {
    if (scheduleTab === 'once') {
      return onceMode === 'datetime' ? datetime : `${delayNum}${delayUnit}`;
    }
    if (scheduleTab === 'interval') return `every ${intervalNum}${intervalUnit}`;
    return cronExpr.trim();
  };

  const buildDeliver = () => {
    if (platform === 'local') return '';
    return channel ? `${platform}:${channel}` : platform;
  };

  const isScheduleValid = () => {
    if (scheduleTab === 'once') return onceMode === 'datetime' ? !!datetime : !!delayNum;
    if (scheduleTab === 'interval') return !!intervalNum;
    return !!cronExpr.trim();
  };

  const canSubmit = name.trim() && prompt.trim() && isScheduleValid();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { name: name.trim(), prompt: prompt.trim(), schedule: buildSchedule() };
    if (repeat) data.repeat = repeat;
    const deliverTarget = buildDeliver();
    if (deliverTarget) data.deliver = deliverTarget;
    if (model.trim()) data.model = model.trim();
    onSubmit(data);
  };

  const channelOptions = selectedChannels.map((item) => ({
    value: item.id,
    label: `${item.name} (${CHANNEL_TYPE_LABELS[item.type] || item.type})`,
  }));
  if (channel && !selectedChannels.some((item) => item.id === channel)) {
    channelOptions.unshift({ value: channel, label: `${channel}（未知频道）` });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card bordered={false} className="shadow-warm">
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Typography.Text type="secondary" className="mb-2 block text-[12px]">
              名称 *
            </Typography.Text>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：每日新闻摘要" />
          </div>

          <div>
            <Typography.Text type="secondary" className="mb-2 block text-[12px]">
              提示词 *
            </Typography.Text>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Agent 每次执行时收到的指令"
            />
          </div>

          <div>
            <Typography.Text type="secondary" className="mb-3 block text-[12px]">
              调度模式 *
            </Typography.Text>
            <Space direction="vertical" size={12} className="w-full">
              <Segmented
                block
                options={[
                  { label: '一次性', value: 'once' },
                  { label: '定间隔', value: 'interval' },
                  { label: 'Cron 表达式', value: 'cron' },
                ]}
                value={scheduleTab}
                onChange={setScheduleTab}
              />

              {scheduleTab === 'once' ? (
                <Space direction="vertical" size={12} className="w-full">
                  <Radio.Group
                    value={onceMode}
                    onChange={(e) => setOnceMode(e.target.value)}
                    options={[
                      { label: '延迟执行', value: 'delay' },
                      { label: '指定时间', value: 'datetime' },
                    ]}
                  />

                  {onceMode === 'delay' ? (
                    <Space.Compact className="w-full">
                      <InputNumber
                        min={1}
                        value={delayNum}
                        onChange={setDelayNum}
                        controls={false}
                        placeholder="数值"
                        className="w-full"
                      />
                      <Select
                        value={delayUnit}
                        onChange={setDelayUnit}
                        options={UNIT_OPTIONS}
                        className="min-w-[110px]"
                      />
                    </Space.Compact>
                  ) : (
                    <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
                  )}
                </Space>
              ) : null}

              {scheduleTab === 'interval' ? (
                <Space.Compact className="w-full">
                  <InputNumber
                    min={1}
                    value={intervalNum}
                    onChange={setIntervalNum}
                    controls={false}
                    placeholder="间隔数值"
                    className="w-full"
                  />
                  <Select
                    value={intervalUnit}
                    onChange={setIntervalUnit}
                    options={UNIT_OPTIONS}
                    className="min-w-[110px]"
                  />
                </Space.Compact>
              ) : null}

              {scheduleTab === 'cron' ? (
                <Space direction="vertical" size={12} className="w-full">
                  <Input
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="0 9 * * *"
                  />
                  <Space wrap size={[8, 8]}>
                    {CRON_PRESETS.map((preset) => (
                      <Button key={preset.value} size="small" onClick={() => setCronExpr(preset.value)}>
                        {preset.label}
                      </Button>
                    ))}
                  </Space>
                </Space>
              ) : null}
            </Space>
          </div>

          {scheduleTab !== 'once' ? (
            <div>
              <Typography.Text type="secondary" className="mb-2 block text-[12px]">
                重复次数
              </Typography.Text>
              <InputNumber
                min={1}
                value={repeat}
                onChange={setRepeat}
                controls={false}
                placeholder="留空 = 无限"
                className="w-full"
              />
            </div>
          ) : null}

          <div>
            <Space align="center" size={8} className="mb-2">
              <Typography.Text type="secondary" className="text-[12px]">
                投递目标
              </Typography.Text>
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => setShowDeliverHelp((value) => !value)}
              />
            </Space>

            {showDeliverHelp ? (
              <Alert
                type="info"
                showIcon
                className="mb-3"
                message="任务执行完成后，结果会投递到这里"
                description="留空频道时使用平台默认频道；选择“本地”则只保存在本地，不发送到平台。"
              />
            ) : null}

            <Space direction="vertical" size={12} className="w-full">
              <Select
                value={platform}
                onChange={(value) => {
                  setPlatform(value);
                  setChannel('');
                }}
                options={[
                  { value: 'local', label: PLATFORM_LABELS.local },
                  ...availablePlatforms.map((key) => ({
                    value: key,
                    label: PLATFORM_LABELS[key] || key,
                  })),
                ]}
              />

              {platform !== 'local' ? (
                hasChannelList ? (
                  <Select
                    value={channel || undefined}
                    onChange={setChannel}
                    options={[{ value: '', label: '默认频道' }, ...channelOptions]}
                    placeholder="选择频道"
                  />
                ) : (
                  <Input
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    placeholder="频道 ID（留空使用默认）"
                  />
                )
              ) : null}
            </Space>
          </div>

          <div>
            <Typography.Text type="secondary" className="mb-2 block text-[12px]">
              模型
            </Typography.Text>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultModel ? `留空使用默认（${defaultModel}）` : '留空使用默认'}
            />
          </div>

          <Space>
            <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={!canSubmit}>
              {job ? '保存修改' : '创建任务'}
            </Button>
            <Button onClick={onCancel}>取消</Button>
          </Space>
        </Space>
      </Card>
    </form>
  );
}

function JobDetail({ job, onBack, onEdit }) {
  const { message, modal } = App.useApp();
  const pauseMut = usePauseJob();
  const resumeMut = useResumeJob();
  const runMut = useRunJob();
  const deleteMut = useDeleteJob();

  const isPaused = job.state === 'paused';
  const isCompleted = job.state === 'completed';
  const repeat = job.repeat || {};

  const handlePauseResume = () => {
    const mutation = isPaused ? resumeMut : pauseMut;
    mutation.mutate(job.id, {
      onSuccess: () => message.success(isPaused ? '任务已恢复' : '任务已暂停'),
      onError: (error) => message.error(error?.message || '操作失败'),
    });
  };

  const handleRun = () => {
    modal.confirm({
      title: isCompleted ? '重新触发任务' : '立即执行任务',
      content: `确定要${isCompleted ? '重新触发' : '立即执行'}「${job.name}」吗？`,
      okText: isCompleted ? '重新触发' : '执行',
      cancelText: '取消',
      onOk: () =>
        new Promise((resolve, reject) => {
          runMut.mutate(job.id, {
            onSuccess: () => {
              message.success('任务已触发');
              resolve();
            },
            onError: (error) => {
              message.error(error?.message || '触发失败');
              reject(error);
            },
          });
        }),
    });
  };

  const handleDelete = () => {
    modal.confirm({
      title: '删除任务',
      content: `确定要删除「${job.name}」吗？此操作不可撤销。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () =>
        new Promise((resolve, reject) => {
          deleteMut.mutate(job.id, {
            onSuccess: () => {
              message.success('任务已删除');
              onBack();
              resolve();
            },
            onError: (error) => {
              message.error(error?.message || '删除失败');
              reject(error);
            },
          });
        }),
    });
  };

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className="w-fit !px-0">
        返回列表
      </Button>

      <Card
        bordered={false}
        className="shadow-warm"
        title={
          <Space align="center" size={12}>
            <Typography.Text strong>{job.name}</Typography.Text>
            <StateBadge state={job.state} />
          </Space>
        }
        extra={<Typography.Text type="secondary" className="font-mono">{job.id}</Typography.Text>}
      >
        <Space direction="vertical" size={20} className="w-full">
          <Card size="small" className="bg-surface-overlay/60">
            <Typography.Text type="secondary" className="block text-[12px]">
              提示词
            </Typography.Text>
            <Typography.Paragraph className="!mb-0 !mt-2 whitespace-pre-wrap">
              {job.prompt}
            </Typography.Paragraph>
          </Card>

          <Descriptions
            column={2}
            items={[
              { key: 'schedule', label: '调度', children: <Typography.Text code>{job.schedule_display || '-'}</Typography.Text> },
              { key: 'repeat', label: '重复', children: repeat.times == null ? '无限循环' : `${repeat.completed || 0} / ${repeat.times} 次` },
              { key: 'next', label: '下次执行', children: formatTime(job.next_run_at) },
              { key: 'last', label: '上次执行', children: formatTime(job.last_run_at) },
              { key: 'deliver', label: '投递目标', children: formatDeliverTarget(job.deliver) },
              { key: 'model', label: '模型', children: job.model || '默认' },
              { key: 'created', label: '创建时间', children: formatTime(job.created_at) },
              { key: 'status', label: '上次状态', children: job.last_status || '-' },
            ]}
          />

          {job.last_error || job.last_delivery_error ? (
            <Space direction="vertical" className="w-full" size={12}>
              {job.last_error ? (
                <Alert type="error" message="执行错误" description={job.last_error} showIcon />
              ) : null}
              {job.last_delivery_error ? (
                <Alert type="error" message="投递错误" description={job.last_delivery_error} showIcon />
              ) : null}
            </Space>
          ) : null}

          <Space wrap>
            <Button icon={<EditOutlined />} onClick={onEdit}>
              编辑
            </Button>
            {!isCompleted ? (
              <Button icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={handlePauseResume}>
                {isPaused ? '恢复' : '暂停'}
              </Button>
            ) : null}
            <Button icon={<PlayCircleOutlined />} onClick={handleRun}>
              {isCompleted ? '重新触发' : '立即执行'}
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );
}

function JobItem({ job, onClick }) {
  return (
    <Card
      hoverable
      bordered={false}
      onClick={onClick}
      className="shadow-warm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Space align="center" size={8} className="mb-2">
            <Typography.Text strong>{job.name}</Typography.Text>
            <StateBadge state={job.state} />
          </Space>
          <Typography.Paragraph type="secondary" className="!mb-0">
            <Typography.Text code>{job.schedule_display || '-'}</Typography.Text>
            {job.next_run_at ? ` · 下次: ${formatTime(job.next_run_at)}` : ''}
          </Typography.Paragraph>
        </div>
      </div>
    </Card>
  );
}

export default function Jobs() {
  const { message } = App.useApp();
  const { data, isLoading, isError, error } = useJobs();
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState('');
  const createMut = useCreateJob();
  const updateMut = useUpdateJob();

  const jobs = data?.jobs || [];
  const selectedJob = jobs.find((job) => job.id === selectedId);
  const filtered = search
    ? jobs.filter((job) => (job.name || '').toLowerCase().includes(search.toLowerCase()))
    : jobs;

  if (mode === 'create') {
    return (
      <PageShell title="新建定时任务">
        <JobForm
          onSubmit={(jobData) =>
            createMut.mutate(jobData, {
              onSuccess: (response) => {
                message.success('任务已创建');
                setSelectedId(response?.job?.id || null);
                setMode(null);
              },
              onError: (mutationError) => {
                message.error(mutationError?.message || '创建失败');
              },
            })
          }
          onCancel={() => setMode(null)}
          isSubmitting={createMut.isPending}
        />
      </PageShell>
    );
  }

  if (mode === 'edit' && selectedJob) {
    return (
      <PageShell title="编辑任务">
        <JobForm
          job={selectedJob}
          onSubmit={(jobData) =>
            updateMut.mutate(
              { id: selectedJob.id, data: jobData },
              {
                onSuccess: () => {
                  message.success('任务已更新');
                  setMode(null);
                },
                onError: (mutationError) => {
                  message.error(mutationError?.message || '更新失败');
                },
              },
            )
          }
          onCancel={() => setMode(null)}
          isSubmitting={updateMut.isPending}
        />
      </PageShell>
    );
  }

  if (selectedJob) {
    return (
      <PageShell title="任务详情">
        <JobDetail job={selectedJob} onBack={() => setSelectedId(null)} onEdit={() => setMode('edit')} />
      </PageShell>
    );
  }

  const isCronUnavailable = isError && error?.message?.includes('501');

  return (
    <PageShell
      title="定时任务"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setMode('create')}>
          新建任务
        </Button>
      }
    >
      {isCronUnavailable ? (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="定时任务模块不可用"
          description={
            <span>
              后端未安装 <code>croniter</code> 依赖。请运行 <code>uv pip install croniter</code> 并重启 gateway。
            </span>
          }
        />
      ) : (
        <Space direction="vertical" size={16} className="w-full">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索任务..."
          />

          {isLoading ? (
            <Space direction="vertical" className="w-full" size={12}>
              {[...Array(4)].map((_, index) => (
                <Card key={index} bordered={false} className="shadow-warm">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ))}
            </Space>
          ) : isError ? (
            <Card bordered={false} className="shadow-warm">
              <Empty description={error?.message || '加载失败'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : !filtered.length ? (
            <Card bordered={false} className="shadow-warm">
              <Empty
                description={search ? '无匹配结果' : '暂无定时任务'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {!search ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setMode('create')}>
                    创建第一个定时任务
                  </Button>
                ) : null}
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" className="w-full" size={12}>
              {filtered.map((job) => (
                <JobItem
                  key={job.id}
                  job={job}
                  onClick={() => {
                    setSelectedId(job.id);
                    setMode(null);
                  }}
                />
              ))}
            </Space>
          )}
        </Space>
      )}
    </PageShell>
  );
}
