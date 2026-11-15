/**
 * Instantly resets scroll position across window, document, root, and any active
 * scrollable view container so every newly opened page/view starts cleanly at top: 0.
 */
export function scrollToTopInstant(extraElement?: HTMLElement | null): void {
  const applyReset = () => {
    try {
      if (extraElement) {
        extraElement.scrollTop = 0;
        extraElement.scrollLeft = 0;
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
      if (typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.scrollTop = 0;
        }
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.scrollTop = 0;
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    }
  };

  applyReset();
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      applyReset();
    });
  }
}
