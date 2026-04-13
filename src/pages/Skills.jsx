import { useState } from 'react';
import { useSkills, useSkill } from '@/hooks/useHermesAPI';
import { Sparkles, ChevronLeft, FileCode, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const CATEGORY_COLORS = {
  default: 'bg-hermes',
  tools: 'bg-blue-500',
  platform: 'bg-emerald-500',
  general: 'bg-purple-500',
};

function SkillCard({ skill, onClick }) {
  const accentColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.default;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-5 shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
    >
      <div className={cn('absolute top-0 inset-x-0 h-0.5', accentColor)} />
      <div className="flex items-start justify-between mb-2 pt-1">
        <h3 className="text-sm font-semibold text-warm-text">{skill.name}</h3>
        {skill.version && (
          <span className="text-[10px] text-warm-muted bg-surface-overlay px-1.5 py-0.5 rounded-md font-mono">v{skill.version}</span>
        )}
      </div>
      {skill.description && (
        <p className="text-xs text-warm-secondary line-clamp-2 mb-3 leading-relaxed">{skill.description}</p>
      )}
      {skill.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-hermes/6 text-hermes-dark font-medium">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function SkillDetail({ name, onBack }) {
  const { data: skill, isLoading } = useSkill(name);
  const { data: files } = useQuery({
    queryKey: ['skillFiles', name],
    queryFn: () => api.getSkillFiles(name),
    enabled: !!name,
  });

  if (isLoading) return <div className="text-sm text-warm-muted animate-pulse">加载中...</div>;
  if (!skill) return <div className="text-sm text-warm-muted">未找到技能</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-warm-muted hover:text-warm-text transition-colors duration-200"
      >
        <ChevronLeft size={16} />
        返回技能列表
      </button>

      <div className="bg-white rounded-2xl p-5 shadow-warm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-hermes/8">
            <Sparkles size={18} className="text-hermes" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-warm-text">{skill.name}</h2>
            {skill.description && <p className="text-xs text-warm-secondary mt-0.5">{skill.description}</p>}
          </div>
        </div>
        <MarkdownRenderer content={skill.content} />
      </div>

      {files?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-warm">
          <h3 className="text-sm font-medium text-warm-text mb-3 flex items-center gap-2">
            <FileCode size={15} className="text-hermes" /> 关联文件
          </h3>
          <div className="space-y-0.5">
            {files.map((f) => (
              <div key={f} className="text-xs text-warm-secondary font-mono py-1.5 px-3 rounded-xl hover:bg-surface-overlay/60 transition-colors duration-200">
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Skills() {
  const { data: skills, isLoading } = useSkills();
  const [selected, setSelected] = useState(null);

  const grouped = {};
  if (skills) {
    for (const s of skills) {
      const cat = s.category || '未分类';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-surface">
      <div className="max-w-4xl mx-auto p-6 space-y-5 animate-fade-in">
        <h1 className="text-2xl font-semibold text-warm-text flex items-center gap-2.5">
          <Sparkles size={22} className="text-hermes" /> 技能
        </h1>

        {selected ? (
          <SkillDetail name={selected} onBack={() => setSelected(null)} />
        ) : isLoading ? (
          <div className="text-sm text-warm-muted animate-pulse">加载中...</div>
        ) : !skills?.length ? (
          <div className="text-sm text-warm-muted text-center py-12">暂未安装任何技能</div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-warm-muted flex items-center gap-2 font-semibold">
                <Tag size={12} />
                {cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((s) => (
                  <SkillCard key={s.slug} skill={s} onClick={() => setSelected(s.slug)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
