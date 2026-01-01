/**
 * FlexiReact Islands Architecture
 * 
 * Islands allow partial hydration - only interactive components are hydrated on the client,
 * while static content remains as HTML. This dramatically reduces JavaScript bundle size.
 * 
 * Usage:
 * - Add 'use island' at the top of a component file
 * - The component will be rendered on server and hydrated on client
 * - Non-island components are pure HTML (no JS)
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import crypto from 'crypto';

// Island registry for tracking all islands in a render
const islandRegistry = new Map();

/**
 * Generates a unique island ID
 */
function generateIslandId(componentName: string): string {
  const hash = crypto.randomBytes(4).toString('hex');
  return `island-${componentName}-${hash}`;
}

/**
 * Island wrapper component for server-side rendering
 * Islands render a placeholder on the server and hydrate on the client
 */
export function Island({ component: Component, props = {}, name, clientPath }: { component: React.ComponentType<any>; props?: any; name: string; clientPath: string }) {
  const islandId = generateIslandId(name);
  
  // Register island for hydration
  islandRegistry.set(islandId, {
    id: islandId,
    name,
    clientPath,
    props
  });

  // On server, render a placeholder - component will hydrate on client
  // This avoids running hooks on the server
  const placeholder = `<div class="island-loading" data-island-placeholder="${name}">Loading...</div>`;

  // Return wrapper with hydration marker
  return React.createElement('div', {
    'data-island': islandId,
    'data-island-name': name,
    'data-island-props': JSON.stringify(props),
    dangerouslySetInnerHTML: { __html: placeholder }
  });
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
interface IslandOptions {
  name?: string;
  clientPath?: string;
}

export function createIsland(Component: React.ComponentType<any>, options: IslandOptions = {}) {
  const { name = (Component as any).name || 'Island', clientPath } = options;

  function IslandWrapper(props: any) {
    return Island({
      component: Component,
      props,
      name,
      clientPath: clientPath || `/_flexi/islands/${name}.js`
    });
  }

  IslandWrapper.displayName = `Island(${name})`;
  IslandWrapper.isIsland = true;
  IslandWrapper.originalComponent = Component;

  return IslandWrapper;
}

/**
 * Generates the client-side hydration script
 */
export function generateHydrationScript(islands: any[]): string {
  if (!islands.length) return '';

  const islandData = islands.map((island: any) => ({
    id: island.id,
    name: island.name,
    path: island.clientPath,
    props: island.props
  }));

  return `
<script type="module">
  const islands = ${JSON.stringify(islandData)};
  
  async function hydrateIslands() {
    const { hydrateRoot } = await import('/_flexi/react-dom-client.js');
    const React = await import('/_flexi/react.js');
    
    for (const island of islands) {
      try {
        const element = document.querySelector(\`[data-island="\${island.id}"]\`);
        if (!element) continue;
        
        const module = await import(island.path);
        const Component = module.default;
        
        // Hydrate the island
        hydrateRoot(element, React.createElement(Component, island.props));
        
        // Mark as hydrated
        element.setAttribute('data-hydrated', 'true');
      } catch (error) {
        console.error(\`Failed to hydrate island \${island.name}:\`, error);
      }
    }
  }
  
  // Hydrate when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateIslands);
  } else {
    hydrateIslands();
  }
</script>`;
}

/**
 * Island loading strategies
 */
export const LoadStrategy = {
  // Hydrate immediately when page loads
  IMMEDIATE: 'immediate',
  // Hydrate when island becomes visible
  VISIBLE: 'visible',
  // Hydrate when user interacts with the page
  IDLE: 'idle',
  // Hydrate on specific media query
  MEDIA: 'media'
};

/**
 * Creates a lazy island that hydrates based on strategy
 */
interface LazyIslandOptions {
  name?: string;
  clientPath?: string;
  strategy?: string;
  media?: string | null;
}

export function createLazyIsland(Component: React.ComponentType<any>, options: LazyIslandOptions = {}) {
  const {
    name = (Component as any).name || 'LazyIsland',
    clientPath,
    strategy = LoadStrategy.VISIBLE,
    media = null
  } = options;

  function LazyIslandWrapper(props: any) {
    const islandId = generateIslandId(name);
    const content = renderToString(React.createElement(Component, props));

    // Register with loading strategy
    islandRegistry.set(islandId, {
      id: islandId,
      name,
      clientPath: clientPath || `/_flexi/islands/${name}.js`,
      props,
      strategy,
      media
    });

    return React.createElement('div', {
      'data-island': islandId,
      'data-island-name': name,
      'data-island-strategy': strategy,
      'data-island-media': media,
      'data-island-props': JSON.stringify(props),
      dangerouslySetInnerHTML: { __html: content }
    });
  }

  LazyIslandWrapper.displayName = `LazyIsland(${name})`;
  LazyIslandWrapper.isIsland = true;
  LazyIslandWrapper.isLazy = true;

  return LazyIslandWrapper;
}

/**
 * Generates advanced hydration script with loading strategies
 */
export function generateAdvancedHydrationScript(islands: any[]): string {
  if (!islands.length) return '';

  const islandData = islands.map((island: any) => ({
    id: island.id,
    name: island.name,
    path: island.clientPath,
    props: island.props,
    strategy: island.strategy || LoadStrategy.IMMEDIATE,
    media: island.media
  }));

  return `
<script type="module">
  const islands = ${JSON.stringify(islandData)};
  
  async function hydrateIsland(island) {
    const element = document.querySelector(\`[data-island="\${island.id}"]\`);
    if (!element || element.hasAttribute('data-hydrated')) return;
    
    try {
      const { hydrateRoot } = await import('/_flexi/react-dom-client.js');
      const React = await import('/_flexi/react.js');
      const module = await import(island.path);
      const Component = module.default;
      
      hydrateRoot(element, React.createElement(Component, island.props));
      element.setAttribute('data-hydrated', 'true');
    } catch (error) {
      console.error(\`Failed to hydrate island \${island.name}:\`, error);
    }
  }
  
  // Intersection Observer for visible strategy
  const visibleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('data-island');
        const island = islands.find(i => i.id === id);
        if (island) {
          hydrateIsland(island);
          visibleObserver.unobserve(entry.target);
        }
      }
    });
  }, { rootMargin: '50px' });
  
  // Process islands based on strategy
  function processIslands() {
    for (const island of islands) {
      const element = document.querySelector(\`[data-island="\${island.id}"]\`);
      if (!element) continue;
      
      switch (island.strategy) {
        case 'immediate':
          hydrateIsland(island);
          break;
        case 'visible':
          visibleObserver.observe(element);
          break;
        case 'idle':
          requestIdleCallback(() => hydrateIsland(island));
          break;
        case 'media':
          if (island.media && window.matchMedia(island.media).matches) {
            hydrateIsland(island);
          }
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

export default {
  Island,
  createIsland,
  createLazyIsland,
  getRegisteredIslands,
  generateHydrationScript,
  generateAdvancedHydrationScript,
  LoadStrategy
};
