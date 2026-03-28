/**
 * Velix v5 Islands Architecture
 *
 * Islands allow partial hydration — only interactive components are hydrated
 * on the client, while static content remains as HTML.
 *
 * Usage: Add 'use island' at the top of a component file.
 */

import React from 'react';
import crypto from 'crypto';

// Island registry for tracking all islands in a render
const islandRegistry = new Map();

function generateIslandId(componentName: string): string {
  const hash = crypto.randomBytes(4).toString('hex');
  return `island-${componentName}-${hash}`;
}

/**
 * Island wrapper component for server-side rendering
 */
export function Island({ component: Component, props = {}, name, clientPath }: {
  component: React.ComponentType<any>;
  props?: any;
  name: string;
  clientPath: string;
}) {
  const islandId = generateIslandId(name);

  islandRegistry.set(islandId, { id: islandId, name, clientPath, props });

  return React.createElement('div', {
    'data-island': islandId,
    'data-island-name': name,
    'data-island-props': JSON.stringify(props),
  }, React.createElement(Component, props));
}

/**
 * Gets all registered islands and clears the registry
 */
export function getRegisteredIslands() {
  const islands = Array.from(islandRegistry.values());
  islandRegistry.clear();
  return islands;
}

/**
 * Creates an island component wrapper
 */
export function createIsland(Component: React.ComponentType<any>, options: { name?: string; clientPath?: string } = {}) {
  const { name = (Component as any).name || 'Island', clientPath } = options;

  function IslandWrapper(props: any) {
    return Island({
      component: Component, props, name,
      clientPath: clientPath || `/__velix/islands/${name}.js`
    });
  }

  IslandWrapper.displayName = `Island(${name})`;
  IslandWrapper.isIsland = true;
  IslandWrapper.originalComponent = Component;
  return IslandWrapper;
}

/**
 * Island loading strategies
 */
export const LoadStrategy = {
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  MEDIA: 'media'
} as const;

/**
 * Creates a lazy island that hydrates based on strategy
 */
export function createLazyIsland(Component: React.ComponentType<any>, options: {
  name?: string; clientPath?: string; strategy?: string; media?: string | null;
} = {}) {
  const {
    name = (Component as any).name || 'LazyIsland',
    clientPath,
    strategy = LoadStrategy.VISIBLE,
    media = null
  } = options;

  function LazyIslandWrapper(props: any) {
    const islandId = generateIslandId(name);

    islandRegistry.set(islandId, {
      id: islandId, name,
      clientPath: clientPath || `/__velix/islands/${name}.js`,
      props, strategy, media
    });

    return React.createElement('div', {
      'data-island': islandId,
      'data-island-name': name,
      'data-island-strategy': strategy,
      'data-island-media': media,
      'data-island-props': JSON.stringify(props),
    });
  }

  LazyIslandWrapper.displayName = `LazyIsland(${name})`;
  LazyIslandWrapper.isIsland = true;
  LazyIslandWrapper.isLazy = true;
  return LazyIslandWrapper;
}

/**
 * Generates the client-side hydration script for islands
 */
export function generateHydrationScript(islands: any[]): string {
  if (!islands.length) return '';

  const islandData = islands.map((island: any) => ({
    id: island.id, name: island.name,
    path: island.clientPath, props: island.props
  }));

  return `
<script type="module">
  const islands = ${JSON.stringify(islandData)};

  async function hydrateIslands() {
    const { hydrateRoot } = await import('/__velix/react-dom-client.js');
    const React = await import('/__velix/react.js');

    for (const island of islands) {
      try {
        const el = document.querySelector(\`[data-island="\${island.id}"]\`);
        if (!el) continue;
        const mod = await import(island.path);
        hydrateRoot(el, React.createElement(mod.default, island.props));
        el.setAttribute('data-hydrated', 'true');
      } catch (error) {
        console.error(\`Failed to hydrate island \${island.name}:\`, error);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateIslands);
  } else {
    hydrateIslands();
  }
</script>`;
}

/**
 * Generates advanced hydration script with loading strategies
 */
export function generateAdvancedHydrationScript(islands: any[]): string {
  if (!islands.length) return '';

  const islandData = islands.map((island: any) => ({
    id: island.id, name: island.name, path: island.clientPath,
    props: island.props, strategy: island.strategy || LoadStrategy.IMMEDIATE,
    media: island.media
  }));

  return `
<script type="module">
  const islands = ${JSON.stringify(islandData)};

  async function hydrateIsland(island) {
    const el = document.querySelector(\`[data-island="\${island.id}"]\`);
    if (!el || el.hasAttribute('data-hydrated')) return;

    try {
      const { hydrateRoot } = await import('/__velix/react-dom-client.js');
      const React = await import('/__velix/react.js');
      const mod = await import(island.path);
      hydrateRoot(el, React.createElement(mod.default, island.props));
      el.setAttribute('data-hydrated', 'true');
    } catch (error) {
      console.error(\`Failed to hydrate island \${island.name}:\`, error);
    }
  }

  const visibleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('data-island');
        const island = islands.find(i => i.id === id);
        if (island) { hydrateIsland(island); visibleObserver.unobserve(entry.target); }
      }
    });
  }, { rootMargin: '50px' });

  function processIslands() {
    for (const island of islands) {
      const el = document.querySelector(\`[data-island="\${island.id}"]\`);
      if (!el) continue;
      switch (island.strategy) {
        case 'immediate': hydrateIsland(island); break;
        case 'visible': visibleObserver.observe(el); break;
        case 'idle': requestIdleCallback(() => hydrateIsland(island)); break;
        case 'media':
          if (island.media && window.matchMedia(island.media).matches) hydrateIsland(island);
          break;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processIslands);
  } else {
    processIslands();
  }
</script>`;
}

export default { Island, createIsland, createLazyIsland, getRegisteredIslands, generateHydrationScript, generateAdvancedHydrationScript, LoadStrategy };
