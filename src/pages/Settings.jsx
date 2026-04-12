import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfig, useEnv } from '@/hooks/useHermesAPI';
import { api } from '@/lib/api';
import { Settings as SettingsIcon, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

function ConfigSection({ config }) {
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (patch) => api.patchConfig(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config'] }),
  });

  const modelDefault = edits['model.default'] ?? (typeof config.model === 'object' ? config.model.default : config.model) ?? '';
  const modelProvider = edits['model.provider'] ?? config.model?.provider ?? '';

  const handleSave = () => {
    const patch = {};
    if (edits['model.default'] !== undefined || edits['model.provider'] !== undefined) {
      patch.model = {
        ...(typeof config.model === 'object' ? config.model : {}),
        ...(edits['model.default'] !== undefined && { default: edits['model.default'] }),
        ...(edits['model.provider'] !== undefined && { provider: edits['model.provider'] }),
      };
    }
    if (edits['tools'] !== undefined) {
      try { patch.tools = JSON.parse(edits['tools']); } catch { /* skip */ }
    }
    if (Object.keys(patch).length > 0) mutation.mutate(patch);
    setEdits({});
  };

  return (
    <div className="bg-white rounded-2xl p-5 space-y-5 shadow-warm">
      <h2 className="text-sm font-semibold text-warm-text">config.yaml</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="模型" value={modelDefault} onChange={(v) => setEdits({ ...edits, 'model.default': v })} />
        <Field label="提供方" value={modelProvider} onChange={(v) => setEdits({ ...edits, 'model.provider': v })} />
      </div>

      <div>
        <label className="text-xs text-warm-muted block mb-1.5 font-medium">原始配置 (JSON)</label>
        <pre className="bg-surface-overlay rounded-xl p-4 text-xs text-warm-secondary overflow-auto max-h-64 font-mono border border-warm-border/60">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={Object.keys(edits).length === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            Object.keys(edits).length > 0
              ? 'bg-gradient-to-r from-hermes to-hermes-dark text-white shadow-warm hover:shadow-warm-lg'
              : 'bg-surface-overlay text-warm-muted cursor-not-allowed'
          )}
        >
          <Save size={14} />
          保存
        </button>
        {mutation.isSuccess && (
          <span className="text-xs text-emerald-600 font-medium">保存成功</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-warm-muted block mb-1.5 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-warm-border rounded-xl px-3 py-2.5 text-sm text-warm-text focus:outline-none focus:border-hermes/40 focus:ring-2 focus:ring-hermes/10 transition-all duration-200"
      />
    </div>
  );
}

function EnvSection() {
  const { data: envVars, isLoading } = useEnv();
  const [showKeys, setShowKeys] = useState({});

  if (isLoading) return <div className="text-sm text-warm-muted animate-pulse">加载中...</div>;

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4 shadow-warm">
      <h2 className="text-sm font-semibold text-warm-text">环境变量 (.env)</h2>

      {!envVars || Object.keys(envVars).length === 0 ? (
        <p className="text-xs text-warm-muted">未找到环境变量</p>
      ) : (
        <div className="rounded-xl border border-warm-border/60 overflow-hidden">
          {Object.entries(envVars).map(([key, value], i) => {
            const masked = value === '****';
            const shown = showKeys[key];
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-3 text-sm px-4 py-2.5',
                  i % 2 === 0 ? 'bg-white' : 'bg-surface-overlay/30'
                )}
              >
                <span className="font-mono text-xs text-warm-text w-52 truncate shrink-0 font-medium">{key}</span>
                <span className="text-xs text-warm-muted flex-1 truncate font-mono">
                  {masked && !shown ? '••••••••' : value}
                </span>
                {masked && (
                  <button
                    onClick={() => setShowKeys((p) => ({ ...p, [key]: !p[key] }))}
                    className="text-warm-muted hover:text-warm-secondary transition-colors duration-200"
                    title={shown ? '隐藏' : '显示'}
                  >
                    {shown ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { data: config, isLoading } = useConfig();

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5 animate-fade-in">
        <h1 className="text-2xl font-semibold text-warm-text flex items-center gap-2.5">
          <SettingsIcon size={22} className="text-warm-secondary" /> 设置
        </h1>

        <div className="bg-hermes/5 border border-hermes/15 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-hermes-dark">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-hermes" />
          <span>修改 config.yaml 和 .env 后需要重启 <code className="bg-hermes/10 px-1.5 py-0.5 rounded-md font-mono text-hermes-dark">hermes gateway</code> 才能生效。</span>
        </div>

        {isLoading ? (
          <div className="text-sm text-warm-muted animate-pulse">加载中...</div>
        ) : (
          <ConfigSection config={config || {}} />
        )}

        <EnvSection />
      </div>
    </div>
  );
}
