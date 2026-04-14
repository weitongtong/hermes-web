import { Zap, Clock, DollarSign, Wrench } from 'lucide-react';
import { formatTokenCount } from '@/lib/format';

function formatDuration(startEpoch, endEpoch) {
  if (!startEpoch || !endEpoch) return null;
  const seconds = Math.round(endEpoch - startEpoch);
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}小时${remainMins}分` : `${hrs}小时`;
}

function StatItem({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <div className="w-7 h-7 rounded-lg bg-hermes/6 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-hermes" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-warm-muted">{label}</p>
        <p className="text-sm font-medium text-warm-text">{value}</p>
        {sub && <p className="text-[11px] text-warm-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SessionStats({ session }) {
  if (!session) return null;

  const totalTokens = (session.input_tokens || 0) + (session.output_tokens || 0);
  const hasTokens = totalTokens > 0;
  const hasCost = session.estimated_cost_usd > 0 || session.actual_cost_usd > 0;
  const duration = formatDuration(session.started_at, session.ended_at);

  if (!hasTokens && !hasCost && !duration && !session.tool_call_count) return null;

  const tokenDetails = [
    session.input_tokens > 0 && `输入 ${formatTokenCount(session.input_tokens)}`,
    session.output_tokens > 0 && `输出 ${formatTokenCount(session.output_tokens)}`,
    session.cache_read_tokens > 0 && `缓存读 ${formatTokenCount(session.cache_read_tokens)}`,
    session.cache_write_tokens > 0 && `缓存写 ${formatTokenCount(session.cache_write_tokens)}`,
    session.reasoning_tokens > 0 && `推理 ${formatTokenCount(session.reasoning_tokens)}`,
  ].filter(Boolean).join(' · ');

  const costText = session.actual_cost_usd > 0
    ? `$${session.actual_cost_usd.toFixed(4)}`
    : session.estimated_cost_usd > 0
      ? `$${session.estimated_cost_usd.toFixed(4)}`
      : null;

  const costSub = session.actual_cost_usd > 0
    ? '实际费用'
    : session.estimated_cost_usd > 0
      ? '预估费用'
      : null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {hasTokens && (
        <StatItem icon={Zap} label="Token 用量" value={`${formatTokenCount(totalTokens)} tokens`} sub={tokenDetails} />
      )}
      {session.tool_call_count > 0 && (
        <StatItem icon={Wrench} label="工具调用" value={`${session.tool_call_count} 次`} />
      )}
      {costText && (
        <StatItem icon={DollarSign} label="费用" value={costText} sub={costSub} />
      )}
      {duration && (
        <StatItem icon={Clock} label="会话耗时" value={duration} sub={session.end_reason || null} />
      )}
    </div>
  );
}
