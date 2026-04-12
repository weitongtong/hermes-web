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
        <span className={warn ? 'text-amber-600 font-medium' : 'text-gray-500'}>
          {current.toLocaleString()} / {limit.toLocaleString()} chars
        </span>
        <span className={warn ? 'text-amber-600 font-medium' : 'text-gray-400'}>{pct.toFixed(0)}%</span>
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

export default function Memory() {
  const [tab, setTab] = useState('memory');
  const { data, isLoading } = useMemory(tab);

  const tabs = [
    { key: 'memory', label: 'Agent Memory', icon: Brain },
    { key: 'user', label: 'User Profile', icon: FileText },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Brain size={22} className="text-hermes" /> Memory
          </h1>
        </div>

        <div className="bg-hermes/5 border border-hermes/15 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-hermes-dark">
          <Info size={14} className="shrink-0 mt-0.5 text-hermes" />
          <span>Memory entries are read-only. To modify them, use the chat to ask Hermes to update its memory.</span>
        </div>

        <div className="flex gap-1 border-b border-gray-200 pb-px">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm transition-all duration-150 border-b-2 -mb-px',
                tab === key
                  ? 'border-hermes text-hermes font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
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
          <div className="text-sm text-gray-400 animate-pulse">Loading...</div>
        ) : data?.entries.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">No entries yet</div>
        ) : (
          <div className="space-y-3">
            {data.entries.map((entry, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-hermes/10 shadow-sm shadow-gray-200/50 transition-all duration-200"
              >
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-hermes/10 text-hermes text-xs font-bold mb-3">
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
