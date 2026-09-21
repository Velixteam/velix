import type { Route } from '../types.js';
/**
 * Scans app/ directory for file-based routing asynchronously
 * Supports: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx, [param].tsx
 */
export declare function scanAppDirectory(baseDir: string, currentDir: string, parentSegments?: string[], parentLayout?: string | null, parentMiddleware?: string | null): Promise<Route[]>;
export declare function scanApiDirectory(baseDir: string, currentDir: string, parentSegments?: string[]): Promise<Route[]>;
//# sourceMappingURL=scanner.d.ts.map