/**
 * Async generator that reads an SSE stream from a fetch Response body
 * and yields parsed JSON delta objects.
 *
 * Usage:
 *   for await (const delta of parseSSEStream(response.body)) { ... }
 */
export async function* parseSSEStream(readableStream) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          yield JSON.parse(data);
        } catch {
          // malformed JSON chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
