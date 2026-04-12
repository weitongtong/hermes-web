import { useState } from 'react';
import { useMemory } from '@/hooks/useHermesAPI';
import { Brain, FileText, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

function UsageBar({ current, limit }) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const warn = pct > 80;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={warn ? 'text-amber-600 font-medium' : 'text-warm-secondary'}>
          {current.toLocaleString()} / {limit.toLocaleString()} 字符
        </span>
        <span className={warn ? 'text-amber-600 font-medium' : 'text-warm-muted'}>{pct.toFixed(0)}%</span>
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

export default function Memory() {
  const [tab, setTab] = useState('memory');
  const { data, isLoading } = useMemory(tab);

  const tabs = [
    { key: 'memory', label: 'Agent 记忆', icon: Brain },
    { key: 'user', label: '用户画像', icon: FileText },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-warm-text flex items-center gap-2.5">
            <Brain size={22} className="text-hermes" /> 记忆
          </h1>
        </div>

        <div className="bg-hermes/5 border border-hermes/15 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-hermes-dark">
          <Info size={14} className="shrink-0 mt-0.5 text-hermes" />
          <span>记忆条目为只读。如需修改，请通过对话让 Hermes 更新其记忆。</span>
        </div>

        <div className="flex gap-1 border-b border-warm-border pb-px">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-200 border-b-2 -mb-px',
                tab === key
                  ? 'border-hermes text-hermes-dark font-medium'
                  : 'border-transparent text-warm-muted hover:text-warm-secondary hover:border-warm-border'
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {data && (
          <UsageBar current={data.charCount} limit={data.charLimit} />
        )}

        {isLoading ? (
          <div className="text-sm text-warm-muted animate-pulse">加载中...</div>
        ) : data?.entries.length === 0 ? (
          <div className="text-sm text-warm-muted text-center py-12">暂无记忆条目</div>
        ) : (
          <div className="space-y-3">
            {data.entries.map((entry, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-warm hover:shadow-warm-lg transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-hermes/10 text-hermes text-xs font-bold mb-3">
                  {i + 1}
                </div>
                <MarkdownRenderer content={entry} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
