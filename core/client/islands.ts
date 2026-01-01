/**
 * FlexiReact Client Islands
 * Client-side island utilities
 */

import React from 'react';

/**
 * Hook to check if component is hydrated
 */
export function useIsland() {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return { isHydrated };
}

/**
 * Island boundary component
 * Wraps interactive components for partial hydration
 */
export function IslandBoundary({ children, fallback = null, name = 'island' }) {
  const { isHydrated } = useIsland();

  // On server or before hydration, render children normally
  // The server will wrap this in the island marker
  if (!isHydrated && fallback) {
    return fallback;
  }

  return React.createElement('div', {
    'data-island-boundary': name,
    children
  });
}

/**
 * Creates a lazy-loaded island
 */
interface LazyIslandOptions {
  fallback?: React.ReactNode;
  name?: string;
}

export function createClientIsland(loader: () => Promise<any>, options: LazyIslandOptions = {}) {
  const { fallback = null, name = 'lazy-island' } = options;

  return function LazyIsland(props) {
    const [Component, setComponent] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      loader()
        .then(mod => setComponent(() => mod.default || mod))
        .catch(err => setError(err));
    }, []);

    if (error) {
      return React.createElement('div', {
        className: 'island-error',
        children: `Failed to load ${name}`
      });
    }

    if (!Component) {
      return fallback || React.createElement('div', {
        className: 'island-loading',
        children: 'Loading...'
      });
    }

    return React.createElement(Component, props);
  };
}

/**
 * Island with interaction trigger
 * Only hydrates when user interacts
 */
export function InteractiveIsland({ children, trigger = 'click', fallback }: { children: React.ReactNode; trigger?: string; fallback?: React.ReactNode }) {
  const [shouldHydrate, setShouldHydrate] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleInteraction = () => {
      setShouldHydrate(true);
    };

    element.addEventListener(trigger, handleInteraction, { once: true });

    return () => {
      element.removeEventListener(trigger, handleInteraction);
    };
  }, [trigger]);

  if (!shouldHydrate) {
    return React.createElement('div', {
      ref,
      'data-interactive-island': 'true',
      children: fallback || children
    });
  }

  return children;
}

/**
 * Media query island
 * Only hydrates when media query matches
 */
export function MediaIsland({ children, query, fallback }) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  if (!matches) {
    return fallback || null;
  }

  return children;
}

export default {
  useIsland,
  IslandBoundary,
  createClientIsland,
  InteractiveIsland,
  MediaIsland
};
