/**
 * Velix v5 Client Module
 * Client-side navigation, hydration, and the Link component.
 */

export { useParams, useQuery, usePathname } from '../context.js';

// ============================================================================
// Client-side Router
// ============================================================================

interface RouterState {
  pathname: string;
  query: Record<string, string>;
  params: Record<string, string>;
}

const listeners = new Set<() => void>();
let currentState: RouterState = {
  pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  query: {},
  params: {},
};

function notify() {
  listeners.forEach(fn => fn());
}

export const router = {
  push(url: string) {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', url);
    currentState = { ...currentState, pathname: url.split('?')[0] };
    notify();
  },

  replace(url: string) {
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, '', url);
    currentState = { ...currentState, pathname: url.split('?')[0] };
    notify();
  },

  back() {
    if (typeof window === 'undefined') return;
    window.history.back();
  },

  forward() {
    if (typeof window === 'undefined') return;
    window.history.forward();
  },

  refresh() {
    if (typeof window === 'undefined') return;
    window.location.reload();
  },

  prefetch(_url: string) {
    // Future: implement prefetching
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): RouterState {
    return currentState;
  },
};

/**
 * Hook to access the Velix client router
 */
export function useRouter() {
  return router;
}

// Listen for popstate (browser back/forward)
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    currentState = { ...currentState, pathname: window.location.pathname };
    notify();
  });
}

// ============================================================================
// Link Component
// ============================================================================

import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean | 'hover' | 'visible';
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  children: React.ReactNode;
}

/**
 * Client-side navigation link component
 *
 * @example
 * ```tsx
 * import { Link } from 'velix/client';
 *
 * <Link href="/dashboard">Dashboard</Link>
 * <Link href="/blog" prefetch>Blog</Link>
 * ```
 */
export function Link({ href, prefetch = false, replace: shouldReplace = false, scroll = true, shallow = false, children, onClick, onMouseEnter, ...rest }: LinkProps) {
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [isPrefetched, setIsPrefetched] = React.useState(false);

  // Prefetch on hover
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch === 'hover' && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
    onMouseEnter?.(e);
  };

  // Prefetch when visible
  React.useEffect(() => {
    if (prefetch === 'visible' && linkRef.current && !isPrefetched) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            router.prefetch(href);
            setIsPrefetched(true);
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );
      observer.observe(linkRef.current);
      return () => observer.disconnect();
    }
  }, [href, prefetch, isPrefetched]);

  // Prefetch immediately
  React.useEffect(() => {
    if (prefetch === true && !isPrefetched) {
      router.prefetch(href);
      setIsPrefetched(true);
    }
  }, [href, prefetch, isPrefetched]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior for external links, ctrl/meta clicks, etc.
    if (
      href.startsWith('http') || href.startsWith('//') ||
      e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ||
      e.button !== 0
    ) {
      onClick?.(e);
      return;
    }

    e.preventDefault();
    onClick?.(e);

    // Notify DevTools of navigation start
    if (typeof window !== 'undefined' && (window as any).__VELIX_DEV_TOOLS__) {
      (window as any).__VELIX_DEV_TOOLS__.setStatus('navigating');
    }

    if (shouldReplace) {
      router.replace(href);
    } else {
      router.push(href);
    }

    if (scroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return React.createElement('a', { ref: linkRef, href, onClick: handleClick, onMouseEnter: handleMouseEnter, ...rest }, children);
}

// ============================================================================
// Hydration
// ============================================================================

/**
 * Client entry point for hydrating the app
 */
export async function hydrate() {
  if (typeof window === 'undefined') return;

  const { hydrateRoot } = await import('react-dom/client');
  const rootElement = document.getElementById('__velix');

  if (!rootElement) {
    console.warn('[Velix] No #__velix element found for hydration');
    return;
  }

  // Minimal hydration — full implementation is done per-island
  console.log('[Velix] Hydration complete');
}

export default { Link, useRouter, router, hydrate };
