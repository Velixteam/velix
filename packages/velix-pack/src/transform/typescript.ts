import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { Resolver } from '../resolver/index.js';
import { isClientModule, isServerModule } from '../graph/boundary.js';
import { ModuleType } from '../types.js';

export interface TransformResultTS {
  code: string;
  map?: string;
  imports: string[];
  type: ModuleType;
}

export async function transformTypeScript(
  filePath: string,
  content: string,
  resolver: Resolver
): Promise<TransformResultTS> {
  const ext = path.extname(filePath);
  const loader: esbuild.Loader = ext === '.tsx' ? 'tsx' : ext === '.jsx' ? 'jsx' : 'ts';

  const result = await esbuild.transform(content, {
    loader,
    target: 'es2022',
    format: 'esm',
    jsx: 'automatic',
    sourcemap: 'inline',
    sourcefile: filePath,
  });

  // Extract imports from code using regex or AST scan
  const imports = extractImports(content, filePath, resolver);

  // Determine type
  let type: ModuleType = 'shared';
  if (isServerModule(filePath, content)) {
    type = 'server';
  } else if (isClientModule(filePath, content)) {
    type = 'client';
  }

  return {
    code: result.code,
    map: result.map,
    imports,
    type,
  };
}

export function extractImports(content: string, filePath: string, resolver: Resolver): string[] {
  const imports: string[] = [];
  // Regex matches static import statements & dynamic import()
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    if (importPath) {
      const resolved = resolver.resolve(importPath, filePath);
      if (resolved) {
        imports.push(resolved);
      }
    }
  }

  return Array.from(new Set(imports));
}
