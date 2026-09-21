/**
 * Velix v5 Plugin System
 * Extensible hook-based plugin architecture
 */
export declare const PluginHooks: {
    readonly CONFIG: "config";
    readonly SERVER_START: "server:start";
    readonly REQUEST: "request";
    readonly RESPONSE: "response";
    readonly ROUTES_LOADED: "routes:loaded";
    readonly BEFORE_RENDER: "render:before";
    readonly AFTER_RENDER: "render:after";
    readonly BUILD_START: "build:start";
    readonly BUILD_END: "build:end";
};
export type PluginHook = typeof PluginHooks[keyof typeof PluginHooks];
export interface PluginHookArgs {
    [PluginHooks.CONFIG]: [config: import('../config.js').VelixConfig];
    [PluginHooks.SERVER_START]: [context: {
        config: import('../config.js').VelixConfig;
        isDev: boolean;
        projectRoot: string;
    }, isDev: boolean];
    [PluginHooks.REQUEST]: [req: import('http').IncomingMessage, res: import('http').ServerResponse];
    [PluginHooks.RESPONSE]: [req: import('http').IncomingMessage, res: import('http').ServerResponse, duration: number];
    [PluginHooks.ROUTES_LOADED]: [routes: import('../types.js').RouteTree];
    [PluginHooks.BEFORE_RENDER]: [html: string, context: {
        route: import('../types.js').Route;
        config: import('../config.js').VelixConfig;
        isDev: boolean;
    }];
    [PluginHooks.AFTER_RENDER]: [html: string, context: {
        route: import('../types.js').Route;
        config: import('../config.js').VelixConfig;
        isDev: boolean;
    }];
    [PluginHooks.BUILD_START]: [];
    [PluginHooks.BUILD_END]: [stats: {
        time: number;
    }];
}
export interface VelixPluginDefinition {
    name: string;
    version?: string;
    setup?: (config: import('../config.js').VelixConfig) => void | Promise<void>;
    hooks?: {
        [K in PluginHook]?: (...args: PluginHookArgs[K]) => unknown;
    };
    [key: string]: unknown;
}
export declare class PluginManager {
    private plugins;
    private hooks;
    /**
     * Register a plugin
     */
    register(plugin: VelixPluginDefinition): void;
    /**
     * Run a hook with arguments
     */
    runHook<K extends PluginHook>(hookName: K, ...args: PluginHookArgs[K]): Promise<void>;
    /**
     * Run a waterfall hook — each handler transforms the first argument
     */
    runWaterfallHook<K extends PluginHook>(hookName: K, value: PluginHookArgs[K][0], ...args: PluginHookArgs[K] extends [unknown, ...infer Rest] ? Rest : []): Promise<PluginHookArgs[K][0]>;
    /**
     * Get all registered plugins
     */
    getPlugins(): VelixPluginDefinition[];
    /**
     * Check if a plugin is registered
     */
    hasPlugin(name: string): boolean;
}
export declare const pluginManager: PluginManager;
/**
 * Load plugins from project configuration
 */
export declare function loadPlugins(projectRoot: string, config: {
    plugins?: unknown[];
}): Promise<void>;
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
export declare function definePlugin(definition: VelixPluginDefinition): VelixPluginDefinition;
export declare const builtinPlugins: {
    /**
     * Security headers plugin
     */
    security: VelixPluginDefinition;
    /**
     * Request logging plugin
     */
    logger: VelixPluginDefinition;
};
//# sourceMappingURL=index.d.ts.map