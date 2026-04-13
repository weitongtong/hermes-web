import { useRef, useCallback, useEffect } from 'react';

/**
 * Smart auto-scroll: only scroll to bottom when user is already near the bottom.
 * Returns a ref for the scroll container and a scrollToBottom function.
 */
export function useAutoScroll(deps = [], threshold = 150) {
  const containerRef = useRef(null);
  const isNearBottom = useRef(true);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkNearBottom, { passive: true });
    return () => el.removeEventListener('scroll', checkNearBottom);
  }, [checkNearBottom]);

  useEffect(() => {
    if (isNearBottom.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, scrollToBottom };
}
