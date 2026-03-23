/**
 * Velix v5 — Main Entry Point
 *
 * The primary export for the velix framework.
 *
 * @example
 * ```ts
 * import { defineConfig, redirect, json, Link } from 'velix';
 * ```
 */

// ── Configuration ──
export { defineConfig, loadConfig, resolvePaths, VelixConfigSchema, defaultConfig, type VelixConfig } from './config.js';

// ── Types ──
export type {
  Route, RouteTree, RouteMatch, RouteType,
  PageProps, LayoutProps, ErrorProps, LoadingProps, NotFoundProps,
  PageComponent, LayoutComponent, ErrorComponent, LoadingComponent, NotFoundComponent,
  IslandConfig, IslandManifest,
  Middleware, ApiHandler, NextFunction,
  ServerAction, TypedActionResult, ActionState,
  VelixPlugin, Metadata,
  BuildOptions, BuildResult, StaticPath, StaticProps,
} from './types.js';

// ── Helpers ──
export {
  redirect, notFound, json, html, text,
  RedirectError, NotFoundError,
  cookies, headers,
  parseJson, parseFormData, parseSearchParams,
  getMethod, getPathname, isMethod,
  type CookieOptions,
} from './helpers.js';

// ── Router ──
export { buildRouteTree, matchRoute, findRouteLayouts } from './router/index.js';

// ── Server ──
export { createServer, type VelixServer } from './server/index.js';

// ── Middleware ──
export { middlewares, runMiddleware, loadMiddleware, composeMiddleware } from './middleware/index.js';

// ── Plugins ──
export { definePlugin, pluginManager, loadPlugins, PluginManager, PluginHooks } from './plugins/index.js';
export { default as tailwindPlugin } from './plugins/tailwind.js';

// ── Islands ──
export { Island, createIsland, createLazyIsland, getRegisteredIslands, generateHydrationScript, generateAdvancedHydrationScript, LoadStrategy } from './islands/index.js';

// ── Metadata & SEO ──
export { generateMetadataTags, mergeMetadata, generateJsonLd, jsonLd, generateSitemap, generateRobotsTxt } from './metadata/index.js';

// ── Actions ──
export {
  serverAction, registerAction, getAction, executeAction,
  callServerAction, deserializeArgs, useActionContext,
  formAction, useVelixAction, bindArgs,
  useActionState, useOptimistic, useFormStatus,
} from './actions/index.js';

// ── Hooks ──
export { useAsyncData, useOptimisticMutation, preloadResource, use } from './hooks/index.js';

// ── Context ──
export { useParams, useQuery, usePathname, useRequest, RequestContext, RouteContext, LayoutContext, createRequestContext } from './context.js';

// ── Client ──
export { Link, useRouter, router } from './client/index.js';

// ── Components ──
export { Image, type ImageProps } from './components/Image.js';

// ── Build ──
export { build } from './build/index.js';

// ── Utils ──
export { generateHash, escapeHtml, findFiles, ensureDir, cleanDir, copyDir, debounce, formatBytes, formatTime, sleep, isServerComponent, isClientComponent, isIsland as isIslandComponent } from './utils.js';

// ── Logger ──
export { logger } from './logger.js';
