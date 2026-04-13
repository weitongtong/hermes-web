/**
 * Parse `<think>...</think>` blocks out of assistant content.
 * Creates a fresh regex each call to avoid stale lastIndex from /g flag.
 */
export function stripThinking(content) {
  if (!content) return { display: '', thinking: '', isThinking: false };

  const thinkBlocks = [];
  const display = content
    .replace(/<think>([\s\S]*?)<\/think>/g, (_match, inner) => {
      thinkBlocks.push(inner.trim());
      return '';
    })
    .trim();

  const openCount = (content.match(/<think>/g) || []).length;
  const closeCount = (content.match(/<\/think>/g) || []).length;

  return {
    display,
    thinking: thinkBlocks.join('\n\n'),
    isThinking: openCount > closeCount,
  };
}
