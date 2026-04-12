import { useStatus, useSessions, useJobs } from '@/hooks/useHermesAPI';
import {
  Cpu, Wifi, WifiOff, Brain, Sparkles, MessageSquare,
  Activity, Server, Timer,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const iconBgMap = {
  hermes: 'bg-hermes/10 text-hermes-dark',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
};

function StatCard({ icon: Icon, label, value, sub, theme = 'hermes', delay = 0 }) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-warm-muted mb-2 font-medium tracking-wide uppercase">{label}</p>
          <p className="text-xl font-semibold text-warm-text">{value ?? '-'}</p>
          {sub && <p className="text-xs text-warm-muted mt-1">{sub}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', iconBgMap[theme])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit, unit = '字符' }) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const warn = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-warm-secondary">{label}</span>
        <span className={warn ? 'text-amber-600 font-medium' : 'text-warm-muted'}>
          {current.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', warn ? 'bg-amber-400' : 'bg-gradient-to-r from-hermes to-hermes-light')}
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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-warm-text">仪表盘</h1>
          <p className="text-sm text-warm-muted mt-1">Hermes Agent 系统状态概览</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Cpu} label="模型" value={model.default || '未设置'} sub={model.provider ? `提供方：${model.provider}` : ''} theme="hermes" delay={0} />
          <StatCard icon={Server} label="平台" value={platforms.length} sub={platforms.map((p) => p.name).join(', ') || '无'} theme="blue" delay={50} />
          <StatCard icon={Brain} label="记忆" value={`${(memory.memoryChars || 0) + (memory.userChars || 0)}`} sub="字符" theme="emerald" delay={100} />
          <StatCard icon={Sparkles} label="技能" value={status?.skillCount ?? 0} sub="已安装" theme="purple" delay={150} />
          <StatCard icon={Timer} label="定时任务" value={jobs.length} sub={pausedJobs > 0 ? `${activeJobs} 活跃 / ${pausedJobs} 已暂停` : `${activeJobs} 活跃`} theme="amber" delay={200} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-warm animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h2 className="text-sm font-medium text-warm-text">记忆用量</h2>
            <UsageBar label="MEMORY.md" current={memory.memoryChars || 0} limit={memory.memoryLimit || 2200} />
            <UsageBar label="USER.md" current={memory.userChars || 0} limit={memory.userLimit || 1375} />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-warm animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-sm font-medium text-warm-text mb-3">平台</h2>
            {platforms.length === 0 ? (
              <p className="text-xs text-warm-muted">暂无已配置的平台</p>
            ) : (
              <div className="space-y-2">
                {platforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg hover:bg-surface-overlay/60 transition-colors duration-200">
                    {p.enabled ? (
                      <Wifi size={14} className="text-emerald-500" />
                    ) : (
                      <WifiOff size={14} className="text-warm-muted" />
                    )}
                    <span className="text-warm-text">{p.name}</span>
                    <span className={cn('text-xs ml-auto font-medium', p.enabled ? 'text-emerald-600' : 'text-warm-muted')}>
                      {p.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-warm animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <h2 className="text-sm font-medium text-warm-text mb-3">最近会话</h2>
          {!sessions?.length ? (
            <p className="text-xs text-warm-muted">暂无会话</p>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl hover:bg-surface-overlay/60 transition-colors duration-200">
                  <MessageSquare size={14} className="text-warm-muted shrink-0" />
                  <span className="text-warm-text truncate flex-1">{s.title || s.id}</span>
                  <span className="text-xs text-warm-muted shrink-0">
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
