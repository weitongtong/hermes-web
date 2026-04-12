import { useStatus, useSessions, useJobs } from '@/hooks/useHermesAPI';
import {
  Cpu, Wifi, WifiOff, Brain, Sparkles, MessageSquare,
  Activity, Server, Timer,
} from 'lucide-react';
import { cn } from '@/lib/cn';

function StatCard({ icon: Icon, label, value, sub, color = 'text-hermes', accent = 'bg-hermes' }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm shadow-gray-200/50 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-r', accent)} />
      <div className="flex items-start justify-between pl-2">
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium tracking-wide uppercase">{label}</p>
          <p className={cn('text-xl font-semibold', color)}>{value ?? '-'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg bg-surface-overlay', color)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit, unit = 'chars' }) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const warn = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className={warn ? 'text-amber-600 font-medium' : 'text-gray-400'}>
          {current.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', warn ? 'bg-amber-500' : 'bg-gradient-to-r from-hermes to-hermes-light')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: status, isLoading } = useStatus();
  const { data: sessions } = useSessions(5);
  const { data: jobsData } = useJobs();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Activity size={24} className="text-hermes animate-pulse" />
      </div>
    );
  }

  const model = status?.model || {};
  const platforms = status?.platforms || [];
  const memory = status?.memory || {};
  const jobs = jobsData?.jobs || [];
  const activeJobs = jobs.filter((j) => j.enabled && j.state !== 'paused').length;
  const pausedJobs = jobs.filter((j) => !j.enabled || j.state === 'paused').length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">仪表盘</h1>
          <p className="text-sm text-gray-400 mt-0.5">Hermes Agent 系统状态概览</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Cpu}
            label="模型"
            value={model.default || '未设置'}
            sub={model.provider ? `提供方：${model.provider}` : ''}
            accent="bg-hermes"
          />
          <StatCard
            icon={Server}
            label="平台"
            value={platforms.length}
            sub={platforms.map((p) => p.name).join(', ') || '无'}
            color="text-blue-600"
            accent="bg-blue-500"
          />
          <StatCard
            icon={Brain}
            label="记忆"
            value={`${(memory.memoryChars || 0) + (memory.userChars || 0)}`}
            sub="字符"
            color="text-emerald-600"
            accent="bg-emerald-500"
          />
          <StatCard
            icon={Sparkles}
            label="技能"
            value={status?.skillCount ?? 0}
            sub="已安装"
            color="text-purple-600"
            accent="bg-purple-500"
          />
          <StatCard
            icon={Timer}
            label="定时任务"
            value={jobs.length}
            sub={pausedJobs > 0 ? `${activeJobs} 活跃 / ${pausedJobs} 已暂停` : `${activeJobs} 活跃`}
            color="text-amber-600"
            accent="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm shadow-gray-200/50">
            <h2 className="text-sm font-medium text-gray-700">记忆用量</h2>
            <UsageBar label="MEMORY.md" current={memory.memoryChars || 0} limit={memory.memoryLimit || 2200} />
            <UsageBar label="USER.md" current={memory.userChars || 0} limit={memory.userLimit || 1375} />
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm shadow-gray-200/50">
            <h2 className="text-sm font-medium text-gray-700 mb-3">平台</h2>
            {platforms.length === 0 ? (
              <p className="text-xs text-gray-400">暂无已配置的平台</p>
            ) : (
              <div className="space-y-2">
                {platforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 text-sm">
                    {p.enabled ? (
                      <Wifi size={14} className="text-emerald-500" />
                    ) : (
                      <WifiOff size={14} className="text-gray-300" />
                    )}
                    <span className="text-gray-700">{p.name}</span>
                    <span className={cn('text-xs ml-auto font-medium', p.enabled ? 'text-emerald-600' : 'text-gray-400')}>
                      {p.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm shadow-gray-200/50">
          <h2 className="text-sm font-medium text-gray-700 mb-3">最近会话</h2>
          {!sessions?.length ? (
            <p className="text-xs text-gray-400">暂无会话</p>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-lg hover:bg-surface-overlay/60 transition-colors">
                  <MessageSquare size={14} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700 truncate flex-1">{s.title || s.id}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {s.started_at ? new Date(s.started_at).toLocaleString('zh-CN') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
