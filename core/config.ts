/**
 * FlexiReact Configuration System
 * Handles loading, validation, and merging of configuration
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { z } from 'zod';
import pc from 'picocolors';

/**
 * Configuration Schema (Zod validation)
 */
const BuildConfigSchema = z.object({
  target: z.string().default('es2022'),
  minify: z.boolean().default(true),
  sourcemap: z.boolean().default(true),
  splitting: z.boolean().default(true)
}).default({});

const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost')
}).default({});

const SSGConfigSchema = z.object({
  enabled: z.boolean().default(false),
  paths: z.array(z.string()).default([])
}).default({});

const IslandsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  directive: z.string().default('use island')
}).default({});

const RSCConfigSchema = z.object({
  enabled: z.boolean().default(true)
}).default({});

const PluginSchema = z.object({
  name: z.string(),
  setup: z.function().optional()
}).passthrough();

export const FlexiReactConfigSchema = z.object({
  // Directories
  pagesDir: z.string().default('pages'),
  layoutsDir: z.string().default('layouts'),
  publicDir: z.string().default('public'),
  outDir: z.string().default('.flexi'),
  
  // Build options
  build: BuildConfigSchema,
  
  // Server options
  server: ServerConfigSchema,
  
  // SSG options
  ssg: SSGConfigSchema,
  
  // Islands (partial hydration)
  islands: IslandsConfigSchema,
  
  // RSC options
  rsc: RSCConfigSchema,
  
  // Plugins
  plugins: z.array(PluginSchema).default([]),
  
  // Styles (CSS files to include)
  styles: z.array(z.string()).default([]),
  
  // Scripts (JS files to include)
  scripts: z.array(z.string()).default([]),
  
  // Favicon path
  favicon: z.string().nullable().default(null)
});

export type FlexiReactConfig = z.infer<typeof FlexiReactConfigSchema>;

/**
 * Default configuration
 */
export const defaultConfig: FlexiReactConfig = FlexiReactConfigSchema.parse({});

/**
 * Helper function to define configuration with full type support
 * Use this in your flexireact.config.ts file
 */
export function defineConfig(config: Partial<FlexiReactConfig>): Partial<FlexiReactConfig> {
  return config;
}

/**
 * Loads and validates configuration from the project root
 */
export async function loadConfig(projectRoot: string): Promise<FlexiReactConfig> {
  const configPathTs = path.join(projectRoot, 'flexireact.config.ts');
  const configPathJs = path.join(projectRoot, 'flexireact.config.js');
  const configPath = fs.existsSync(configPathTs) ? configPathTs : configPathJs;
  
  let userConfig: Partial<FlexiReactConfig> = {};
  
  if (fs.existsSync(configPath)) {
    try {
      const configUrl = pathToFileURL(configPath).href;
      const module = await import(`${configUrl}?t=${Date.now()}`);
      userConfig = module.default || module;
    } catch (error: any) {
      console.warn(pc.yellow(`⚠ Failed to load config: ${error.message}`));
    }
  }
  
  // Merge and validate with Zod
  const merged = deepMerge(defaultConfig, userConfig);
  
  try {
    return FlexiReactConfigSchema.parse(merged);
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

/**
 * Deep merge two objects
 */
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

/**
 * Resolves all paths in config relative to project root
 */
export function resolvePaths(config: any, projectRoot: string): any {
  return {
    ...config,
    pagesDir: path.resolve(projectRoot, config.pagesDir),
    layoutsDir: path.resolve(projectRoot, config.layoutsDir),
    publicDir: path.resolve(projectRoot, config.publicDir),
    outDir: path.resolve(projectRoot, config.outDir)
  };
}
