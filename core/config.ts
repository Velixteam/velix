/**
 * FlexiReact Configuration System
 * Handles loading and merging of configuration from flexireact.config.js
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Default configuration
export const defaultConfig = {
  // Directories
  pagesDir: 'pages',
  layoutsDir: 'layouts',
  publicDir: 'public',
  outDir: '.flexi',
  
  // Build options
  build: {
    target: 'es2022',
    minify: true,
    sourcemap: true,
    splitting: true
  },
  
  // Server options
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  // SSG options
  ssg: {
    enabled: false,
    paths: []
  },
  
  // Islands (partial hydration)
  islands: {
    enabled: true
  },
  
  // RSC options
  rsc: {
    enabled: true
  },
  
  // Plugins
  plugins: [],
  
  // Styles (CSS files to include)
  styles: [],
  
  // Scripts (JS files to include)
  scripts: [],
  
  // Favicon path
  favicon: null
};

/**
 * Loads configuration from the project root
 * @param {string} projectRoot - Path to project root
 * @returns {Object} Merged configuration
 */
export async function loadConfig(projectRoot: string) {
  // Try .ts first, then .js
  const configPathTs = path.join(projectRoot, 'flexireact.config.ts');
  const configPathJs = path.join(projectRoot, 'flexireact.config.js');
  const configPath = fs.existsSync(configPathTs) ? configPathTs : configPathJs;
  
  let userConfig = {};
  
  if (fs.existsSync(configPath)) {
    try {
      const configUrl = pathToFileURL(configPath).href;
      const module = await import(`${configUrl}?t=${Date.now()}`);
      userConfig = module.default || module;
    } catch (error: any) {
      console.warn('Warning: Failed to load flexireact config:', error.message);
    }
  }
  
  // Deep merge configs
  return deepMerge(defaultConfig, userConfig);
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
