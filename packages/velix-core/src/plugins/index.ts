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

export interface PluginHookArgs {
  [PluginHooks.CONFIG]: [config: import('../config.js').VelixConfig];
  [PluginHooks.SERVER_START]: [context: { config: import('../config.js').VelixConfig; isDev: boolean; projectRoot: string }, isDev: boolean];
  [PluginHooks.REQUEST]: [req: import('http').IncomingMessage, res: import('http').ServerResponse];
  [PluginHooks.RESPONSE]: [req: import('http').IncomingMessage, res: import('http').ServerResponse, duration: number];
  [PluginHooks.ROUTES_LOADED]: [routes: import('../types.js').RouteTree];
  [PluginHooks.BEFORE_RENDER]: [html: string, context: { route: import('../types.js').Route; config: import('../config.js').VelixConfig; isDev: boolean }];
  [PluginHooks.AFTER_RENDER]: [html: string, context: { route: import('../types.js').Route; config: import('../config.js').VelixConfig; isDev: boolean }];
  [PluginHooks.BUILD_START]: [];
  [PluginHooks.BUILD_END]: [stats: { time: number }];
}

export interface VelixPluginDefinition {
  name: string;
  version?: string;
  setup?: (config: import('../config.js').VelixConfig) => void | Promise<void>;
  hooks?: { [K in PluginHook]?: (...args: PluginHookArgs[K]) => unknown };
  [key: string]: unknown; // Allow for Zod passthrough and extra properties
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
  async runHook<K extends PluginHook>(hookName: K, ...args: PluginHookArgs[K]): Promise<void> {
    const handlers = this.hooks.get(hookName) || [];
    for (const handler of handlers) {
      await handler(...args);
    }
  }

  /**
   * Run a waterfall hook — each handler transforms the first argument
   */
  async runWaterfallHook<K extends PluginHook>(hookName: K, value: PluginHookArgs[K][0], ...args: PluginHookArgs[K] extends [unknown, ...infer Rest] ? Rest : []): Promise<PluginHookArgs[K][0]> {
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
export async function loadPlugins(projectRoot: string, config: { plugins?: unknown[] }): Promise<void> {
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
      } else if (typeof entry === 'object' && entry !== null && 'name' in entry) {
        // Inline plugin definition
        pluginManager.register(entry as VelixPluginDefinition);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`⚠ Failed to load plugin: ${error?.message || String(error)}`);
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
      [PluginHooks.RESPONSE]: (_req: unknown, res: unknown) => {
        const response = res as import('http').ServerResponse;
        if (!response.headersSent) {
          response.setHeader('X-Content-Type-Options', 'nosniff');
          response.setHeader('X-Frame-Options', 'DENY');
          response.setHeader('X-XSS-Protection', '1; mode=block');
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
      [PluginHooks.RESPONSE]: (req: unknown, _res: unknown, duration: unknown) => {
        const request = req as import('http').IncomingMessage;
        console.log(`  ${request.method} ${request.url} ${duration}ms`);
      }
    }
  }),
};
