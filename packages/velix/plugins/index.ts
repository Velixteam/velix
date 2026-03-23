/**
 * Velix v5 Plugin System
 * Extensible hook-based plugin architecture
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// ============================================================================
// Plugin Hooks
// ============================================================================

export const PluginHooks = {
  CONFIG: 'config',
  SERVER_START: 'server:start',
  REQUEST: 'request',
  RESPONSE: 'response',
  ROUTES_LOADED: 'routes:loaded',
  BEFORE_RENDER: 'render:before',
  AFTER_RENDER: 'render:after',
  BUILD_START: 'build:start',
  BUILD_END: 'build:end',
} as const;

export type PluginHook = typeof PluginHooks[keyof typeof PluginHooks];

// ============================================================================
// Plugin Interface
// ============================================================================

export interface VelixPluginDefinition {
  name: string;
  version?: string;
  setup?: (config: any) => void | Promise<void>;
  hooks?: Partial<Record<PluginHook, (...args: any[]) => any>>;
  [key: string]: any; // Allow for Zod passthrough and extra properties
}

// ============================================================================
// Plugin Manager
// ============================================================================

export class PluginManager {
  private plugins: VelixPluginDefinition[] = [];
  private hooks: Map<string, Array<(...args: any[]) => any>> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: VelixPluginDefinition) {
    this.plugins.push(plugin);

    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        if (handler) {
          const existing = this.hooks.get(hookName) || [];
          existing.push(handler);
          this.hooks.set(hookName, existing);
        }
      }
    }
  }

  /**
   * Run a hook with arguments
   */
  async runHook(hookName: string, ...args: any[]): Promise<void> {
    const handlers = this.hooks.get(hookName) || [];
    for (const handler of handlers) {
      await handler(...args);
    }
  }

  /**
   * Run a waterfall hook — each handler transforms the first argument
   */
  async runWaterfallHook(hookName: string, value: any, ...args: any[]): Promise<any> {
    const handlers = this.hooks.get(hookName) || [];
    let result = value;
    for (const handler of handlers) {
      const transformed = await handler(result, ...args);
      if (transformed !== undefined) result = transformed;
    }
    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): VelixPluginDefinition[] {
    return [...this.plugins];
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.some(p => p.name === name);
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const pluginManager = new PluginManager();

// ============================================================================
// Plugin Loader
// ============================================================================

/**
 * Load plugins from project configuration
 */
export async function loadPlugins(projectRoot: string, config: any): Promise<void> {
  const pluginEntries = config.plugins || [];

  for (const entry of pluginEntries) {
    try {
      if (typeof entry === 'string') {
        // Load plugin by name (from plugins/ dir or node_modules)
        const localPath = path.join(projectRoot, 'plugins', entry + '.ts');
        const localPathJs = path.join(projectRoot, 'plugins', entry + '.js');
        const localPathDir = path.join(projectRoot, 'plugins', entry, 'index.ts');

        let pluginPath: string | null = null;
        if (fs.existsSync(localPath)) pluginPath = localPath;
        else if (fs.existsSync(localPathJs)) pluginPath = localPathJs;
        else if (fs.existsSync(localPathDir)) pluginPath = localPathDir;

        if (pluginPath) {
          const url = pathToFileURL(pluginPath).href;
          const mod = await import(`${url}?t=${Date.now()}`);
          const plugin = mod.default || mod;
          if (plugin.name) {
            pluginManager.register(plugin);
          }
        } else {
          // Try node_modules
          try {
            const mod = await import(entry);
            const plugin = mod.default || mod;
            if (plugin.name) pluginManager.register(plugin);
          } catch {
            console.warn(`⚠ Plugin not found: ${entry}`);
          }
        }
      } else if (typeof entry === 'object' && entry.name) {
        // Inline plugin definition
        pluginManager.register(entry);
      }
    } catch (err: any) {
      console.warn(`⚠ Failed to load plugin: ${err.message}`);
    }
  }
}

// ============================================================================
// Plugin Definition Helper
// ============================================================================

/**
 * Helper to define a Velix plugin with type safety.
 *
 * @example
 * ```ts
 * export default definePlugin({
 *   name: 'my-plugin',
 *   hooks: {
 *     'server:start': (server) => {
 *       console.log('Server started!');
 *     }
 *   }
 * });
 * ```
 */
export function definePlugin(definition: VelixPluginDefinition): VelixPluginDefinition {
  return definition;
}

// ============================================================================
// Built-in Plugins
// ============================================================================

export const builtinPlugins = {
  /**
   * Security headers plugin
   */
  security: definePlugin({
    name: 'velix:security',
    hooks: {
      [PluginHooks.RESPONSE]: (_req, res) => {
        if (!res.headersSent) {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
        }
      }
    }
  }),

  /**
   * Request logging plugin
   */
  logger: definePlugin({
    name: 'velix:logger',
    hooks: {
      [PluginHooks.RESPONSE]: (req, _res, duration) => {
        console.log(`  ${req.method} ${req.url} ${duration}ms`);
      }
    }
  }),
};
