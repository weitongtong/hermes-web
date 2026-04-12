import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

function CodeBlock({ className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !String(children).includes('\n');

  if (isInline) {
    return (
      <code className="bg-hermes/8 text-hermes-dark px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      {match && (
        <div className="absolute top-0 right-0 px-2.5 py-1 text-[10px] text-gray-400 bg-surface-overlay rounded-bl-lg font-mono">
          {match[1]}
        </div>
      )}
      <pre className="bg-surface-overlay/80 rounded-lg p-4 overflow-x-auto border border-gray-200/60">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className }) {
  return (
    <div className={cn('prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-code:before:content-none prose-code:after:content-none', className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          a: ({ children, ...props }) => (
            <a {...props} className="text-hermes hover:text-hermes-light hover:underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
              <table className="border-collapse text-sm w-full">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-200 bg-surface-overlay px-3 py-2 text-left font-medium text-gray-700 text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-gray-100 px-3 py-2 text-gray-600">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
