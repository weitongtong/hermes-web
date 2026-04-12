import { useState } from 'react';
import {
  useJobs, useCreateJob, useUpdateJob, useDeleteJob,
  usePauseJob, useResumeJob, useRunJob, useChannels, useStatus,
} from '@/hooks/useHermesAPI';
import {
  Timer, Plus, Play, Pause, Trash2, Pencil, ChevronLeft,
  Search, AlertTriangle, Clock, CalendarClock, Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const STATE_MAP = {
  scheduled: { label: '已调度', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused:    { label: '已暂停', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  running:   { label: '运行中', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '已完成', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  error:     { label: '错误',   cls: 'bg-red-50 text-red-600 border-red-200' },
};

function StateBadge({ state }) {
  const s = STATE_MAP[state] || { label: state, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={cn('inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border', s.cls)}>
      {s.label}
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN');
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            取消
          </button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_LABELS = {
  local: '本地', origin: '来源平台', feishu: '飞书', telegram: 'Telegram',
  discord: 'Discord', slack: 'Slack', wecom: '企业微信', dingtalk: '钉钉',
  matrix: 'Matrix', email: '邮件', webhook: 'Webhook',
};

const CHANNEL_TYPE_LABELS = { group: '群组', dm: '私聊', channel: '频道', user: '用户' };

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

function initScheduleFromJob(schedule) {
  const base = { tab: 'once', onceMode: 'delay', delayNum: '', delayUnit: 'm', datetime: '', intervalNum: '', intervalUnit: 'm', cronExpr: '' };
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
    const m = schedule.minutes;
    if (m % 1440 === 0) return { ...base, tab: 'interval', intervalNum: String(m / 1440), intervalUnit: 'd' };
    if (m % 60 === 0) return { ...base, tab: 'interval', intervalNum: String(m / 60), intervalUnit: 'h' };
    return { ...base, tab: 'interval', intervalNum: String(m), intervalUnit: 'm' };
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

function JobForm({ job, onSubmit, onCancel, isSubmitting }) {
  const { data: channelsData } = useChannels();
  const { data: statusData } = useStatus();

  const sched = initScheduleFromJob(job?.schedule);
  const deliv = initDeliverFromJob(job?.deliver);

  const [name, setName] = useState(job?.name || '');
  const [prompt, setPrompt] = useState(job?.prompt || '');
  const [repeat, setRepeat] = useState(job?.repeat?.times != null ? String(job.repeat.times) : '');
  const [model, setModel] = useState(job?.model || '');

  const [scheduleTab, setScheduleTab] = useState(sched.tab);
  const [onceMode, setOnceMode] = useState(sched.onceMode);
  const [delayNum, setDelayNum] = useState(sched.delayNum);
  const [delayUnit, setDelayUnit] = useState(sched.delayUnit);
  const [datetime, setDatetime] = useState(sched.datetime);
  const [intervalNum, setIntervalNum] = useState(sched.intervalNum);
  const [intervalUnit, setIntervalUnit] = useState(sched.intervalUnit);
  const [cronExpr, setCronExpr] = useState(sched.cronExpr);

  const [platform, setPlatform] = useState(deliv.platform);
  const [channel, setChannel] = useState(deliv.channel);
  const [showDeliverHelp, setShowDeliverHelp] = useState(false);

  const platforms = channelsData?.platforms || {};
  const platformKeys = Object.keys(platforms);
  const availablePlatforms = platform !== 'local' && !platformKeys.includes(platform)
    ? [platform, ...platformKeys]
    : platformKeys;
  const selectedChannels = platform !== 'local' ? (platforms[platform] || []) : [];
  const hasChannelList = selectedChannels.length > 0;
  const defaultModel = statusData?.model?.default || '';

  const buildSchedule = () => {
    if (scheduleTab === 'once') {
      return onceMode === 'datetime' ? datetime : `${delayNum}${delayUnit}`;
    }
    if (scheduleTab === 'interval') return `every ${intervalNum}${intervalUnit}`;
    return cronExpr;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { name, prompt, schedule: buildSchedule() };
    if (repeat) data.repeat = parseInt(repeat, 10) || undefined;
    const d = buildDeliver();
    if (d) data.deliver = d;
    if (model) data.model = model;
    onSubmit(data);
  };

  const inputCls = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-hermes/60 focus:ring-1 focus:ring-hermes/20';
  const tabCls = (active) => cn(
    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
    active ? 'bg-hermes/10 text-hermes' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <label className="text-xs text-gray-400 block mb-1">名称 *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="例如：每日新闻摘要" />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">提示词 *</label>
        <textarea required value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className={cn(inputCls, 'resize-none')} placeholder="Agent 每次执行时收到的指令" />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1.5">调度模式 *</label>
        <div className="flex gap-1 mb-3">
          {[
            { key: 'once', label: '一次性' },
            { key: 'interval', label: '定间隔' },
            { key: 'cron', label: 'Cron 表达式' },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setScheduleTab(t.key)} className={tabCls(scheduleTab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {scheduleTab === 'once' && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="radio" name="onceMode" checked={onceMode === 'delay'} onChange={() => setOnceMode('delay')} className="accent-hermes" />
                延迟执行
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="radio" name="onceMode" checked={onceMode === 'datetime'} onChange={() => setOnceMode('datetime')} className="accent-hermes" />
                指定时间
              </label>
            </div>
            {onceMode === 'delay' ? (
              <div className="flex gap-2">
                <input type="number" min="1" value={delayNum} onChange={(e) => setDelayNum(e.target.value)} className={cn(inputCls, 'flex-1')} placeholder="数值" />
                <select value={delayUnit} onChange={(e) => setDelayUnit(e.target.value)} className={cn(inputCls, 'w-24')}>
                  {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            ) : (
              <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className={inputCls} />
            )}
          </div>
        )}

        {scheduleTab === 'interval' && (
          <div className="flex gap-2">
            <input type="number" min="1" value={intervalNum} onChange={(e) => setIntervalNum(e.target.value)} className={cn(inputCls, 'flex-1')} placeholder="间隔数值" />
            <select value={intervalUnit} onChange={(e) => setIntervalUnit(e.target.value)} className={cn(inputCls, 'w-24')}>
              {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        )}

        {scheduleTab === 'cron' && (
          <div className="space-y-2">
            <input value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} className={cn(inputCls, 'font-mono')} placeholder="0 9 * * *" />
            <div className="flex flex-wrap gap-1.5">
              {CRON_PRESETS.map((p) => (
                <button key={p.value} type="button" onClick={() => setCronExpr(p.value)}
                  className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-hermes/10 text-gray-500 hover:text-hermes rounded-md transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {scheduleTab !== 'once' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">重复次数</label>
          <input value={repeat} onChange={(e) => setRepeat(e.target.value)} type="number" min="1" className={inputCls} placeholder="留空=无限" />
        </div>
      )}

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-xs text-gray-400">投递目标</label>
          <button type="button" onClick={() => setShowDeliverHelp((v) => !v)} className="text-gray-300 hover:text-hermes transition-colors">
            <Info size={12} />
          </button>
        </div>
        {showDeliverHelp && (
          <div className="mb-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 space-y-1.5">
            <p>任务执行完成后，Agent 的输出结果发送到哪里：</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="text-hermes font-medium">本地</span>
              <span>仅保存到本地文件，不发送到任何平台</span>
              <span className="text-hermes font-medium">指定平台</span>
              <span>发送到对应平台的默认频道（如飞书、Telegram 等）</span>
              <span className="text-hermes font-medium">平台 + 频道</span>
              <span>发送到指定平台的特定群组或会话</span>
            </div>
            <p className="text-gray-400">留空频道时使用平台的默认频道（由环境变量配置）</p>
          </div>
        )}
        <div className="flex gap-2">
          <select value={platform} onChange={(e) => { setPlatform(e.target.value); setChannel(''); }} className={cn(inputCls, 'w-40')}>
            <option value="local">{PLATFORM_LABELS.local}</option>
            {availablePlatforms.map((k) => (
              <option key={k} value={k}>{PLATFORM_LABELS[k] || k}</option>
            ))}
          </select>
          {platform !== 'local' && (
            hasChannelList ? (
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={cn(inputCls, 'flex-1')}>
                <option value="">默认频道</option>
                {selectedChannels.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({CHANNEL_TYPE_LABELS[c.type] || c.type})</option>
                ))}
                {channel && !selectedChannels.some((c) => c.id === channel) && (
                  <option value={channel}>{channel}（未知频道）</option>
                )}
              </select>
            ) : (
              <input value={channel} onChange={(e) => setChannel(e.target.value)} className={cn(inputCls, 'flex-1')} placeholder="频道 ID（留空使用默认）" />
            )
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">模型</label>
        <input
          list="model-options" value={model} onChange={(e) => setModel(e.target.value)} className={inputCls}
          placeholder={defaultModel ? `使用默认（${defaultModel}）` : '使用默认'}
        />
        <datalist id="model-options">
          {defaultModel && <option value={defaultModel}>{defaultModel}（当前默认）</option>}
        </datalist>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit" disabled={isSubmitting || !isScheduleValid()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-hermes/10 text-hermes hover:bg-hermes/20 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '提交中...' : job ? '保存修改' : '创建任务'}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function JobDetail({ job, onBack, onEdit }) {
  const pauseMut = usePauseJob();
  const resumeMut = useResumeJob();
  const runMut = useRunJob();
  const deleteMut = useDeleteJob();
  const [confirm, setConfirm] = useState(null);

  const isPaused = job.state === 'paused';
  const isCompleted = job.state === 'completed';
  const repeat = job.repeat || {};
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        <ChevronLeft size={16} /> 返回列表
      </button>

      {toast && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-700 animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{job.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{job.id}</p>
          </div>
          <StateBadge state={job.state} />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">提示词</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.prompt}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">调度</p>
            <p className="text-gray-700 font-mono">{job.schedule_display || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">重复</p>
            <p className="text-gray-700">
              {repeat.times == null ? '无限循环' : `${repeat.completed || 0} / ${repeat.times} 次`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">下次执行</p>
            <p className="text-gray-700">{formatTime(job.next_run_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">上次执行</p>
            <p className="text-gray-700">{formatTime(job.last_run_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">投递目标</p>
            <p className="text-gray-700">{PLATFORM_LABELS[job.deliver] || job.deliver || 'local'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">模型</p>
            <p className="text-gray-700">{job.model || '默认'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">创建时间</p>
            <p className="text-gray-700">{formatTime(job.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">上次状态</p>
            <p className="text-gray-700">{job.last_status || '-'}</p>
          </div>
        </div>

        {(job.last_error || job.last_delivery_error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 space-y-1">
            {job.last_error && <p><strong>执行错误：</strong>{job.last_error}</p>}
            {job.last_delivery_error && <p><strong>投递错误：</strong>{job.last_delivery_error}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-hermes hover:bg-hermes/10 rounded-lg transition-colors"
          >
            <Pencil size={13} /> 编辑
          </button>
          {!isCompleted && (
            isPaused ? (
              <button
                onClick={() => resumeMut.mutate(job.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Play size={13} /> 恢复
              </button>
            ) : (
              <button
                onClick={() => pauseMut.mutate(job.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Pause size={13} /> 暂停
              </button>
            )
          )}
          <button
            onClick={() => setConfirm({ type: 'run' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Play size={13} /> {isCompleted ? '重新触发' : '立即执行'}
          </button>
          <button
            onClick={() => setConfirm({ type: 'delete' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
          >
            <Trash2 size={13} /> 删除
          </button>
        </div>
      </div>

      {confirm?.type === 'run' && (
        <ConfirmDialog
          title={isCompleted ? '重新触发' : '立即执行'}
          message={`确定要${isCompleted ? '重新触发' : '立即执行'}任务「${job.name}」吗？`}
          onConfirm={() => {
            runMut.mutate(job.id, {
              onSuccess: () => showToast('任务已触发，正在执行中...'),
            });
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmDialog
          title="删除任务"
          message={`确定要删除任务「${job.name}」吗？此操作不可撤销。`}
          onConfirm={() => { deleteMut.mutate(job.id); setConfirm(null); onBack(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function JobItem({ job, onClick }) {
  const isPaused = job.state === 'paused' || job.state === 'completed';
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border border-gray-100 hover:border-hermes/20 hover:shadow-md hover:shadow-hermes/5 transition-all duration-200 group"
    >
      <div className={cn(
        'w-1 self-stretch rounded-full shrink-0 transition-colors',
        isPaused ? 'bg-gray-200' : 'bg-emerald-300 group-hover:bg-hermes/60'
      )} />
      <CalendarClock size={16} className="text-gray-400 group-hover:text-hermes transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700 truncate font-medium">{job.name}</p>
          <StateBadge state={job.state} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          <span className="font-mono">{job.schedule_display || '-'}</span>
          {job.next_run_at && <span className="ml-2">下次: {formatTime(job.next_run_at)}</span>}
        </p>
      </div>
    </button>
  );
}

export default function Jobs() {
  const { data, isLoading, isError, error } = useJobs();
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState('');
  const createMut = useCreateJob();
  const updateMut = useUpdateJob();

  const jobs = data?.jobs || [];
  const selectedJob = jobs.find((j) => j.id === selectedId);

  const filtered = search
    ? jobs.filter((j) => (j.name || '').toLowerCase().includes(search.toLowerCase()))
    : jobs;

  if (mode === 'create') {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Timer size={22} className="text-hermes" /> 新建定时任务
          </h1>
          <JobForm
            onSubmit={(data) => createMut.mutate(data, { onSuccess: () => setMode(null) })}
            onCancel={() => setMode(null)}
            isSubmitting={createMut.isPending}
          />
        </div>
      </div>
    );
  }

  if (mode === 'edit' && selectedJob) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Timer size={22} className="text-hermes" /> 编辑任务
          </h1>
          <JobForm
            job={selectedJob}
            onSubmit={(data) => updateMut.mutate({ id: selectedJob.id, data }, { onSuccess: () => setMode(null) })}
            onCancel={() => setMode(null)}
            isSubmitting={updateMut.isPending}
          />
        </div>
      </div>
    );
  }

  if (selectedJob) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Timer size={22} className="text-hermes" /> 任务详情
          </h1>
          <JobDetail
            job={selectedJob}
            onBack={() => setSelectedId(null)}
            onEdit={() => setMode('edit')}
          />
        </div>
      </div>
    );
  }

  const isCronUnavailable = isError && error?.message?.includes('501');

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Timer size={22} className="text-hermes" /> 定时任务
          </h1>
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-hermes bg-hermes/10 hover:bg-hermes/20 rounded-lg transition-colors"
          >
            <Plus size={14} /> 新建任务
          </button>
        </div>

        {isCronUnavailable ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">定时任务模块不可用</p>
              <p className="mt-1">后端未安装 <code className="bg-amber-100 px-1 rounded font-mono">croniter</code> 依赖。请运行 <code className="bg-amber-100 px-1 rounded font-mono">uv pip install croniter</code> 并重启 gateway。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索任务..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-hermes/50 focus:ring-2 focus:ring-hermes/10 transition-all"
              />
            </div>

            {isLoading ? (
              <div className="text-sm text-gray-400 animate-pulse">加载中...</div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-500">加载失败</p>
                <p className="text-xs text-gray-400 mt-1">{error?.message || '未知错误'}</p>
              </div>
            ) : !filtered.length ? (
              <div className="text-center py-12">
                <Clock size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">{search ? '无匹配结果' : '暂无定时任务'}</p>
                {!search && (
                  <button
                    onClick={() => setMode('create')}
                    className="mt-3 text-xs text-hermes hover:text-hermes-light transition-colors"
                  >
                    创建第一个定时任务
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((j) => (
                  <JobItem key={j.id} job={j} onClick={() => { setSelectedId(j.id); setMode(null); }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
