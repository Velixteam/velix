import { transformSync } from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Get the framework's React path to ensure single instance
const frameworkReactPath = require.resolve('react');
const frameworkReactDir = path.dirname(frameworkReactPath);

/**
 * Custom ESM loader for JSX files
 * This allows Node.js to import .jsx files directly
 */

export async function load(url, context, nextLoad) {
  // Handle .jsx, .tsx, and .ts files
  const isJsx = url.endsWith('.jsx') || url.includes('.jsx?');
  const isTsx = url.endsWith('.tsx') || url.includes('.tsx?');
  const isTs = url.endsWith('.ts') || url.includes('.ts?');
  
  if (isJsx || isTsx || isTs) {
    // Remove query string for file reading
    const cleanUrl = url.split('?')[0];
    const filePath = fileURLToPath(cleanUrl);
    
    // Read the source file
    let source = readFileSync(filePath, 'utf-8');
    
    // Check for directives
    const firstLine = source.split('\n')[0].trim();
    const isIsland = firstLine === "'use island'" || firstLine === '"use island"' || firstLine === "'use island';" || firstLine === '"use island";';
    const isClient = firstLine === "'use client'" || firstLine === '"use client"' || firstLine === "'use client';" || firstLine === '"use client";';
    
    // Remove directives
    source = source.replace(/^['"]use (client|server|island)['"];?\s*/m, '');
    
    // For island components, wrap the default export to skip SSR hooks
    if (isIsland || isClient) {
      // Add a wrapper that makes the component client-only
      source = `
const _FLEXI_IS_ISLAND = true;
const _FLEXI_IS_CLIENT = ${isClient};
${source}
`;
    }
    
    // Determine the loader based on file extension
    const loader = isTsx ? 'tsx' : isTs ? 'ts' : 'jsx';
    
    // Transform to JS using esbuild
    // Use classic JSX transform to avoid jsx-runtime issues
    const result = transformSync(source, {
      loader,
      format: 'esm',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'node18'
    });
    
    return {
      format: 'module',
      source: result.code,
      shortCircuit: true
    };
  }
  
  // Let Node.js handle other file types
  return nextLoad(url, context);
}

/**
 * Resolve hook to ensure single React instance and handle TS/TSX imports
 */
export async function resolve(specifier, context, nextResolve) {
  // Redirect react imports to framework's React
  if (specifier === 'react' || specifier === 'react-dom' || specifier.startsWith('react/') || specifier.startsWith('react-dom/')) {
    try {
      const resolved = require.resolve(specifier);
      return {
        url: pathToFileURL(resolved).href,
        shortCircuit: true
      };
    } catch {
      // Fall through to default resolution
    }
  }
  
  // Handle TypeScript file imports (resolve .ts/.tsx extensions)
  if (context.parentURL && !specifier.startsWith('node:') && !specifier.startsWith('data:')) {
    // Try to resolve with .tsx, .ts, .jsx extensions
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    const parentPath = fileURLToPath(context.parentURL);
    const parentDir = path.dirname(parentPath);
    
    for (const ext of extensions) {
      try {
        const possiblePath = path.resolve(parentDir, specifier + ext);
        if (require('fs').existsSync(possiblePath)) {
          return {
            url: pathToFileURL(possiblePath).href,
            shortCircuit: true
          };
        }
        
        // Also try index files
        const indexPath = path.resolve(parentDir, specifier, 'index' + ext);
        if (require('fs').existsSync(indexPath)) {
          return {
            url: pathToFileURL(indexPath).href,
            shortCircuit: true
          };
        }
      } catch {
        // Continue to next extension
      }
    }
  }
  
  return nextResolve(specifier, context);
}

