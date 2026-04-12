import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfig, useEnv } from '@/hooks/useHermesAPI';
import { api } from '@/lib/api';
import { Settings as SettingsIcon, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

function ConfigSection({ config, onSave }) {
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (patch) => api.patchConfig(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config'] }),
  });

  const modelDefault = edits['model.default'] ?? (typeof config.model === 'object' ? config.model.default : config.model) ?? '';
  const modelProvider = edits['model.provider'] ?? config.model?.provider ?? '';
  const tools = edits['tools'] ?? (config.tools ? JSON.stringify(config.tools) : '');

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
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-5 shadow-sm shadow-gray-200/50">
      <h2 className="text-sm font-semibold text-gray-700">config.yaml</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Model" value={modelDefault} onChange={(v) => setEdits({ ...edits, 'model.default': v })} />
        <Field label="Provider" value={modelProvider} onChange={(v) => setEdits({ ...edits, 'model.provider': v })} />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1.5 font-medium">Raw Configuration (JSON)</label>
        <pre className="bg-surface-overlay/80 rounded-lg p-4 text-xs text-gray-600 overflow-auto max-h-64 font-mono border border-gray-200/60">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={Object.keys(edits).length === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            Object.keys(edits).length > 0
              ? 'bg-gradient-to-r from-hermes to-hermes-dark text-white shadow-md shadow-hermes/20 hover:shadow-lg hover:shadow-hermes/30'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          )}
        >
          <Save size={14} />
          Save
        </button>
        {mutation.isSuccess && (
          <span className="text-xs text-emerald-600 font-medium">Saved successfully</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1.5 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-hermes/50 focus:ring-2 focus:ring-hermes/10 transition-all"
      />
    </div>
  );
}

function EnvSection() {
  const { data: envVars, isLoading } = useEnv();
  const [showKeys, setShowKeys] = useState({});

  if (isLoading) return <div className="text-sm text-gray-400 animate-pulse">Loading...</div>;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm shadow-gray-200/50">
      <h2 className="text-sm font-semibold text-gray-700">.env</h2>

      {!envVars || Object.keys(envVars).length === 0 ? (
        <p className="text-xs text-gray-400">No environment variables found</p>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          {Object.entries(envVars).map(([key, value], i) => {
            const masked = value === '****';
            const shown = showKeys[key];
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-3 text-sm px-4 py-2.5',
                  i > 0 && 'border-t border-gray-50'
                )}
              >
                <span className="font-mono text-xs text-gray-600 w-52 truncate shrink-0 font-medium">{key}</span>
                <span className="text-xs text-gray-400 flex-1 truncate font-mono">
                  {masked && !shown ? '••••••••' : value}
                </span>
                {masked && (
                  <button
                    onClick={() => setShowKeys((p) => ({ ...p, [key]: !p[key] }))}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                    title={shown ? 'Hide' : 'Show'}
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
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <SettingsIcon size={22} className="text-gray-400" /> Settings
        </h1>

        <div className="bg-hermes/5 border border-hermes/15 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-hermes-dark">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-hermes" />
          <span>Changes to config.yaml and .env require restarting <code className="bg-hermes/10 px-1.5 py-0.5 rounded font-mono text-hermes-dark">hermes gateway</code> to take effect.</span>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <ConfigSection config={config || {}} />
        )}

        <EnvSection />
      </div>
    </div>
  );
}
