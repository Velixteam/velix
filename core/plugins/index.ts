/**
 * FlexiReact Plugin System
 * 
 * Plugins can extend FlexiReact's functionality by hooking into various lifecycle events.
 * 
 * Usage:
 * Create a flexireact.plugin.js file:
 * 
 * export default {
 *   name: 'my-plugin',
 *   
 *   // Called when the server starts
 *   onServerStart(server) {},
 *   
 *   // Called before each request
 *   onRequest(req, res) {},
 *   
 *   // Called before rendering a page
 *   onBeforeRender(page, props) {},
 *   
 *   // Called after rendering a page
 *   onAfterRender(html, page) {},
 *   
 *   // Called during build
 *   onBuild(config) {},
 *   
 *   // Modify esbuild config
 *   esbuildConfig(config) {},
 * };
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Plugin lifecycle hooks
 */
export const PluginHooks = {
  // Server lifecycle
  SERVER_START: 'onServerStart',
  SERVER_STOP: 'onServerStop',
  
  // Request lifecycle
  REQUEST: 'onRequest',
  RESPONSE: 'onResponse',
  
  // Render lifecycle
  BEFORE_RENDER: 'onBeforeRender',
  AFTER_RENDER: 'onAfterRender',
  
  // Build lifecycle
  BUILD_START: 'onBuildStart',
  BUILD_END: 'onBuildEnd',
  
  // Route lifecycle
  ROUTES_LOADED: 'onRoutesLoaded',
  
  // Config
  CONFIG: 'onConfig',
  ESBUILD_CONFIG: 'esbuildConfig'
};

/**
 * Plugin manager class
 */
export class PluginManager {
  plugins: any[];
  hooks: Map<string, any[]>;

  constructor() {
    this.plugins = [];
    this.hooks = new Map();
    
    // Initialize hook arrays
    for (const hook of Object.values(PluginHooks)) {
      this.hooks.set(hook as string, []);
    }
  }

  /**
   * Registers a plugin
   */
  register(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    // Check for duplicate
    if (this.plugins.find(p => p.name === plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered`);
      return;
    }

    this.plugins.push(plugin);

    // Register hooks
    for (const [hookName, handlers] of this.hooks) {
      if (typeof plugin[hookName] === 'function') {
        handlers.push({
          plugin: plugin.name,
          handler: plugin[hookName].bind(plugin)
        });
      }
    }

    console.log(`  ✓ Plugin loaded: ${plugin.name}`);
  }

  /**
   * Unregisters a plugin
   */
  unregister(pluginName) {
    const index = this.plugins.findIndex(p => p.name === pluginName);
    if (index === -1) return;

    this.plugins.splice(index, 1);

    // Remove hooks
    for (const handlers of this.hooks.values()) {
      const hookIndex = handlers.findIndex(h => h.plugin === pluginName);
      if (hookIndex !== -1) {
        handlers.splice(hookIndex, 1);
      }
    }
  }

  /**
   * Runs a hook with all registered handlers
   */
  async runHook(hookName: string, ...args: unknown[]): Promise<Array<{ plugin: string; result?: unknown; error?: unknown }>> {
    const handlers = this.hooks.get(hookName) || [];
    const results: Array<{ plugin: string; result?: unknown; error?: unknown }> = [];

    for (const { plugin, handler } of handlers) {
      try {
        const result = await handler(...args);
        results.push({ plugin, result });
      } catch (error) {
        console.error(`Plugin "${plugin}" error in ${hookName}:`, error);
        results.push({ plugin, error });
      }
    }

    return results;
  }

  /**
   * Runs a hook that can modify a value (waterfall)
   */
  async runWaterfallHook(hookName, initialValue, ...args) {
    const handlers = this.hooks.get(hookName) || [];
    let value = initialValue;

    for (const { plugin, handler } of handlers) {
      try {
        const result = await handler(value, ...args);
        if (result !== undefined) {
          value = result;
        }
      } catch (error) {
        console.error(`Plugin "${plugin}" error in ${hookName}:`, error);
      }
    }

    return value;
  }

  /**
   * Checks if any plugin handles a hook
   */
  hasHook(hookName) {
    const handlers = this.hooks.get(hookName) || [];
    return handlers.length > 0;
  }

  /**
   * Gets all registered plugins
   */
  getPlugins() {
    return [...this.plugins];
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();

/**
 * Loads plugins from project and config
 */
export async function loadPlugins(projectRoot, config) {
  console.log('\n📦 Loading plugins...\n');

  // Load from flexireact.plugin.js
  const pluginPath = path.join(projectRoot, 'flexireact.plugin.js');
  
  if (fs.existsSync(pluginPath)) {
    try {
      const url = pathToFileURL(pluginPath).href;
      const module = await import(`${url}?t=${Date.now()}`);
      const plugin = module.default;
      
      if (plugin) {
        pluginManager.register(plugin);
      }
    } catch (error) {
      console.error('Failed to load flexireact.plugin.js:', error);
    }
  }

  // Load plugins from config
  if (config.plugins && Array.isArray(config.plugins)) {
    for (const pluginConfig of config.plugins) {
      try {
        if (typeof pluginConfig === 'string') {
          // Load from node_modules
          const module = await import(pluginConfig);
          pluginManager.register(module.default);
        } else if (typeof pluginConfig === 'object') {
          // Inline plugin
          pluginManager.register(pluginConfig);
        } else if (typeof pluginConfig === 'function') {
          // Plugin factory
          pluginManager.register(pluginConfig());
        }
      } catch (error) {
        console.error(`Failed to load plugin:`, error);
      }
    }
  }

  console.log(`\n  Total plugins: ${pluginManager.getPlugins().length}\n`);

  return pluginManager;
}

/**
 * Creates a plugin
 */
export function definePlugin(options) {
  return {
    name: options.name || 'unnamed-plugin',
    ...options
  };
}

/**
 * Built-in plugins
 */
export const builtinPlugins = {
  /**
   * Analytics plugin
   */
  analytics(options: { trackingId?: string } = {}) {
    const { trackingId } = options;

    return definePlugin({
      name: 'flexi-analytics',

      onAfterRender(html) {
        if (!trackingId) return html;

        const script = `
          <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${trackingId}');
          </script>
        `;

        return html.replace('</head>', `${script}</head>`);
      }
    });
  },

  /**
   * PWA plugin
   */
  pwa(options: { manifest?: string; serviceWorker?: string } = {}) {
    const { manifest = '/manifest.json', serviceWorker = '/sw.js' } = options;

    return definePlugin({
      name: 'flexi-pwa',

      onAfterRender(html) {
        const tags = `
          <link rel="manifest" href="${manifest}">
          <script>
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('${serviceWorker}');
            }
          </script>
        `;

        return html.replace('</head>', `${tags}</head>`);
      }
    });
  },

  /**
   * SEO plugin
   */
  seo(options: { defaultTitle?: string; titleTemplate?: string; defaultDescription?: string } = {}) {
    const { defaultTitle, titleTemplate = '%s', defaultDescription } = options;

    return definePlugin({
      name: 'flexi-seo',

      onBeforeRender(page, props) {
        const title = props.title || page.title || defaultTitle;
        const description = props.description || page.description || defaultDescription;

        return {
          ...props,
          _seo: {
            title: titleTemplate.replace('%s', title),
            description
          }
        };
      }
    });
  },

  /**
   * Compression plugin (for production)
   */
  compression() {
    return definePlugin({
      name: 'flexi-compression',

      onResponse(req, res, html) {
        // Note: Actual compression would require zlib
        // This is a placeholder for the concept
        res.setHeader('Content-Encoding', 'identity');
        return html;
      }
    });
  },

  /**
   * Security headers plugin
   */
  securityHeaders(options: { headers?: Record<string, string> } = {}) {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...options.headers
    };

    return definePlugin({
      name: 'flexi-security',

      onRequest(req, res) {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
      }
    });
  }
};

export default {
  PluginManager,
  PluginHooks,
  pluginManager,
  loadPlugins,
  definePlugin,
  builtinPlugins
};
