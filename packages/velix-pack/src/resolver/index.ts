import fs from 'fs';
import path from 'path';
import { loadPathAliases, PathAlias } from './aliases.js';

export interface ResolverOptions {
  projectRoot: string;
  extensions?: string[];
}

export class Resolver {
  private projectRoot: string;
  private aliases: PathAlias[];
  private extensions: string[];

  constructor(options: ResolverOptions) {
    this.projectRoot = options.projectRoot;
    this.aliases = loadPathAliases(this.projectRoot);
    this.extensions = options.extensions || ['.tsx', '.ts', '.jsx', '.js', '.json', '.css'];
  }

  public resolve(importPath: string, importerPath: string): string | null {
    // 1. External packages (node_modules or bare specifiers)
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !this.isAliasMatch(importPath)) {
      return null; // External package
    }

    // 2. Resolve alias
    let targetPath = importPath;
    for (const alias of this.aliases) {
      if (importPath === alias.prefix || importPath.startsWith(alias.prefix + '/')) {
        targetPath = importPath.replace(alias.prefix, alias.target);
        break;
      }
    }

    // 3. Absolute vs relative resolution
    let absolutePath = targetPath;
    if (!path.isAbsolute(targetPath)) {
      absolutePath = path.resolve(path.dirname(importerPath), targetPath);
    }

    // 4. Check if exact file exists
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return absolutePath;
    }

    // 4b. Handle ESM .js -> .ts / .tsx mapping
    if (absolutePath.endsWith('.js')) {
      const tsPath = absolutePath.slice(0, -3) + '.ts';
      const tsxPath = absolutePath.slice(0, -3) + '.tsx';
      if (fs.existsSync(tsPath) && fs.statSync(tsPath).isFile()) return tsPath;
      if (fs.existsSync(tsxPath) && fs.statSync(tsxPath).isFile()) return tsxPath;
    }

    // 5. Try extensions
    for (const ext of this.extensions) {
      const pathWithExt = absolutePath + ext;
      if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
        return pathWithExt;
      }
    }

    // 6. Try index file
    for (const ext of this.extensions) {
      const indexPath = path.join(absolutePath, `index${ext}`);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    }

    return null;
  }

  private isAliasMatch(importPath: string): boolean {
    return this.aliases.some(alias => importPath === alias.prefix || importPath.startsWith(alias.prefix + '/'));
  }
}
