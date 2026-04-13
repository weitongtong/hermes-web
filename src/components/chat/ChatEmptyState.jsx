import { Sparkles, Terminal, FileText, Code } from 'lucide-react';

const suggestions = [
  { icon: Terminal, text: '帮我写一个 Python 脚本', prompt: '帮我写一个 Python 脚本，批量重命名当前目录下的文件' },
  { icon: Code, text: '代码审查与优化', prompt: '请审查我的代码并提供优化建议' },
  { icon: FileText, text: '总结一份文档', prompt: '帮我总结一份技术文档的要点' },
  { icon: Sparkles, text: '头脑风暴', prompt: '帮我做一个关于产品功能的头脑风暴' },
];

export default function ChatEmptyState({ onSuggestionClick }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="relative mb-10">
        <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-hermes/10 via-hermes/5 to-transparent blur-2xl animate-pulse-glow" />
        <img src="/hermes.svg" alt="Hermes" className="relative w-14 h-14 drop-shadow-md" />
      </div>

      <h2 className="text-2xl font-semibold text-warm-text mb-2 tracking-tight">
        有什么可以帮你？
      </h2>
      <p className="text-sm text-warm-muted mb-10 max-w-md text-center leading-relaxed">
        Hermes 可以执行命令、管理文件、编写和调试代码，试试下面的建议开始对话吧
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {suggestions.map(({ icon: Icon, text, prompt }) => (
          <button
            key={text}
            onClick={() => onSuggestionClick?.(prompt)}
            className="group flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-warm-border/60 bg-white hover:border-hermes/30 hover:shadow-warm transition-all duration-200 text-left"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-overlay group-hover:bg-hermes/8 flex items-center justify-center transition-colors duration-200">
              <Icon size={15} className="text-warm-muted group-hover:text-hermes transition-colors duration-200" />
            </div>
            <span className="text-[13px] text-warm-secondary group-hover:text-warm-text leading-snug pt-1 transition-colors duration-200">
              {text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
