/**
 * FlexiReact Client Hydration
 * Handles selective hydration of islands and full app hydration
 */

import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';

// Extend Window interface for __FLEXI_DATA__
declare global {
  interface Window {
    __FLEXI_DATA__?: {
      islands?: any[];
      props?: Record<string, any>;
    };
  }
}

/**
 * Hydrates a specific island component
 * React 19: Uses built-in hydration error recovery
 */
export function hydrateIsland(islandId, Component, props) {
  const element = document.querySelector(`[data-island="${islandId}"]`);

  if (!element) {
    console.warn(`Island element not found: ${islandId}`);
    return;
  }

  if (element.hasAttribute('data-hydrated')) {
    return; // Already hydrated
  }

  // React 19: Built-in hydration error recovery
  hydrateRoot(element, React.createElement(Component, props), {
    onRecoverableError: (error, errorInfo) => {
      console.warn(`[FlexiReact] Hydration mismatch in ${islandId}:`, error);
      if (process.env.NODE_ENV === 'development') {
        console.debug('Component stack:', errorInfo.componentStack);
      }
    }
  });

  element.setAttribute('data-hydrated', 'true');

  // Dispatch custom event
  element.dispatchEvent(new CustomEvent('flexi:hydrated', {
    bubbles: true,
    detail: { islandId, props }
  }));
}

/**
 * Hydrates the entire application
 */
export function hydrateApp(App, props = {}) {
  const root = document.getElementById('root');

  if (!root) {
    console.error('Root element not found');
    return;
  }

  // Get server-rendered props
  const serverProps = window.__FLEXI_DATA__?.props || {};
  const mergedProps = { ...serverProps, ...props };

  try {
    hydrateRoot(root, React.createElement(App, mergedProps));
  } catch (error) {
    console.error('Hydration failed, falling back to full render:', error);
    createRoot(root).render(React.createElement(App, mergedProps));
  }
}

/**
 * Hydrates all islands on the page
 */
export async function hydrateAllIslands(islandModules) {
  const islands = document.querySelectorAll('[data-island]');

  for (const element of islands) {
    if (element.hasAttribute('data-hydrated')) continue;

    const islandId = element.getAttribute('data-island');
    const islandName = element.getAttribute('data-island-name');
    const propsJson = element.getAttribute('data-island-props');

    if (!islandId || !islandName) continue;

    try {
      const props = propsJson ? JSON.parse(propsJson) : {};
      const module = islandModules[islandName];

      if (module) {
        hydrateIsland(islandId, module.default || module, props);
      }
    } catch (error) {
      console.error(`Failed to hydrate island ${islandName}:`, error);
    }
  }
}

/**
 * Progressive hydration based on visibility
 */
export function setupProgressiveHydration(islandModules) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        if (element.hasAttribute('data-hydrated')) return;

        const islandName = element.getAttribute('data-island-name');
        const islandId = element.getAttribute('data-island');
        const propsJson = element.getAttribute('data-island-props');

        if (!islandId || !islandName) return;

        try {
          const props = propsJson ? JSON.parse(propsJson) : {};
          const module = await islandModules[islandName]();

          hydrateIsland(islandId, module.default || module, props);
          observer.unobserve(element);
        } catch (error) {
          console.error(`Failed to hydrate island ${islandName}:`, error);
        }
      });
    },
    { rootMargin: '50px' }
  );

  document.querySelectorAll('[data-island]:not([data-hydrated])').forEach(el => {
    observer.observe(el);
  });

  return observer;
}

export default {
  hydrateIsland,
  hydrateApp,
  hydrateAllIslands,
  setupProgressiveHydration
};
