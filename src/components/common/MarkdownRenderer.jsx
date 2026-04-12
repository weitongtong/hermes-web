import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

function CodeBlock({ className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !String(children).includes('\n');

  if (isInline) {
    return (
      <code className="bg-hermes/6 text-hermes-dark px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      {match && (
        <div className="absolute top-0 right-0 px-2.5 py-1 text-[10px] text-hermes bg-surface-overlay/80 rounded-bl-xl rounded-tr-xl font-mono font-medium">
          {match[1]}
        </div>
      )}
      <pre className="bg-[#F5F2EB] rounded-xl p-4 overflow-x-auto border border-warm-border/60">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className }) {
  return (
    <div className={cn(
      'prose prose-sm max-w-none',
      'prose-headings:text-warm-text prose-p:text-warm-secondary prose-strong:text-warm-text',
      'prose-code:before:content-none prose-code:after:content-none',
      'prose-li:text-warm-secondary prose-blockquote:text-warm-secondary prose-blockquote:border-hermes/30',
      className
    )}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          a: ({ children, ...props }) => (
            <a {...props} className="text-hermes hover:text-hermes-dark hover:underline underline-offset-2 transition-colors duration-200" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-warm-border">
              <table className="border-collapse text-sm w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-warm-border bg-surface-overlay px-3 py-2 text-left font-medium text-warm-text text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-warm-border/40 px-3 py-2 text-warm-secondary">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
