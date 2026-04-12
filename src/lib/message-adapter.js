/**
 * Convert backend session messages (from state.db) to the format
 * expected by the frontend MessageBubble component.
 *
 * Backend format:  { id, role, content, tool_call_id, tool_calls, tool_name, timestamp }
 * Frontend format: { role, content, toolCalls: [{ function: { name, arguments } }], isError }
 */
export function adaptSessionMessages(rawMessages) {
  if (!rawMessages?.length) return [];

  return rawMessages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => {
      const adapted = { role: msg.role, content: msg.content || '' };

      if (msg.role === 'assistant' && msg.tool_calls) {
        try {
          const parsed = typeof msg.tool_calls === 'string'
            ? JSON.parse(msg.tool_calls)
            : msg.tool_calls;
          if (Array.isArray(parsed) && parsed.length > 0) {
            adapted.toolCalls = parsed;
          }
        } catch {
          // malformed tool_calls JSON — ignore
        }
      }

      return adapted;
    });
}
