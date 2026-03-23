/**
 * Velix v5 Configuration System
 * Handles loading, validation, and merging of velix.config.ts
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { z } from 'zod';
import pc from 'picocolors';

// ============================================================================
// Configuration Schema (Zod validation)
// ============================================================================

const AppConfigSchema = z.object({
  name: z.string().default('Velix App'),
  url: z.string().url().optional(),
}).default({});

const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
}).default({});

const RoutingConfigSchema = z.object({
  trailingSlash: z.boolean().default(false),
}).default({});

const SEOConfigSchema = z.object({
  sitemap: z.boolean().default(true),
  robots: z.boolean().default(true),
  openGraph: z.boolean().default(true),
}).default({});

const BuildConfigSchema = z.object({
  target: z.string().default('es2022'),
  minify: z.boolean().default(true),
  sourcemap: z.boolean().default(true),
  splitting: z.boolean().default(true),
  outDir: z.string().default('.velix'),
}).default({});

const ExperimentalConfigSchema = z.object({
  islands: z.boolean().default(true),
  streaming: z.boolean().default(true),
}).default({});

const PluginSchema = z.union([
  z.string(),
  z.object({
    name: z.string()
  }).passthrough(),
]);

export const VelixConfigSchema = z.object({
  // App identity
  app: AppConfigSchema,

  // DevTools toggle
  devtools: z.boolean().default(true),

  // Server options
  server: ServerConfigSchema,

  // Routing options
  routing: RoutingConfigSchema,

  // SEO configuration
  seo: SEOConfigSchema,

  // Build options
  build: BuildConfigSchema,

  // Experimental features
  experimental: ExperimentalConfigSchema,

  // Plugins
  plugins: z.array(PluginSchema).default([]),

  // Directories (resolved automatically)
  appDir: z.string().default('app'),
  publicDir: z.string().default('public'),

  // Stylesheets
  styles: z.array(z.string()).default([]),

  // Favicon
  favicon: z.string().nullable().default(null),
});

export type VelixConfig = z.infer<typeof VelixConfigSchema>;

// ============================================================================
// Default configuration
// ============================================================================

export const defaultConfig: VelixConfig = VelixConfigSchema.parse({});

// ============================================================================
// defineConfig helper
// ============================================================================

/**
 * Helper function to define configuration with full type support.
 * Use this in your velix.config.ts file.
 *
 * @example
 * ```ts
 * import { defineConfig } from "velix";
 *
 * export default defineConfig({
 *   app: { name: "My App" },
 *   server: { port: 3000 },
 *   seo: { sitemap: true }
 * });
 * ```
 */
export function defineConfig(config: Partial<VelixConfig>): Partial<VelixConfig> {
  return config;
}

// ============================================================================
// Config Loader
// ============================================================================

/**
 * Loads and validates configuration from velix.config.ts
 */
export async function loadConfig(projectRoot: string): Promise<VelixConfig> {
  const configPathTs = path.join(projectRoot, 'velix.config.ts');
  const configPathJs = path.join(projectRoot, 'velix.config.js');
  // Support legacy config for migration
  const configPathLegacyTs = path.join(projectRoot, 'flexireact.config.ts');
  const configPathLegacyJs = path.join(projectRoot, 'flexireact.config.js');

  let configPath: string | null = null;
  if (fs.existsSync(configPathTs)) configPath = configPathTs;
  else if (fs.existsSync(configPathJs)) configPath = configPathJs;
  else if (fs.existsSync(configPathLegacyTs)) configPath = configPathLegacyTs;
  else if (fs.existsSync(configPathLegacyJs)) configPath = configPathLegacyJs;

  let userConfig: Partial<VelixConfig> = {};

  if (configPath) {
    try {
      const configUrl = pathToFileURL(configPath).href;
      const module = await import(`${configUrl}?t=${Date.now()}`);
      userConfig = module.default || module;
    } catch (error: any) {
      console.warn(pc.yellow(`⚠ Failed to load config: ${error.message}`));
    }
  }

  // Merge and validate with Zod
  const merged = deepMerge(defaultConfig, userConfig as Record<string, any>);

  try {
    return VelixConfigSchema.parse(merged);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      console.error(pc.red('✖ Configuration validation failed:'));
      for (const issue of err.issues) {
        console.error(pc.dim(`  - ${issue.path.join('.')}: ${issue.message}`));
      }
      process.exit(1);
    }
    throw err;
  }
}

// ============================================================================
// Path Resolution
// ============================================================================

/**
 * Resolves all paths in config relative to project root
 */
export function resolvePaths(config: VelixConfig, projectRoot: string): VelixConfig & { resolvedAppDir: string; resolvedPublicDir: string; resolvedOutDir: string } {
  return {
    ...config,
    resolvedAppDir: path.resolve(projectRoot, config.appDir),
    resolvedPublicDir: path.resolve(projectRoot, config.publicDir),
    resolvedOutDir: path.resolve(projectRoot, config.build.outDir),
  };
}

// ============================================================================
// Utility: Deep merge
// ============================================================================

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}
