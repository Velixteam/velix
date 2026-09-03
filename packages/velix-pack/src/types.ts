export type ModuleType = 'server' | 'client' | 'shared';

export interface ModuleNode {
  id: string; // Relative path or unique identifier
  path: string; // Absolute file path
  type: ModuleType;
  dependencies: Set<string>; // IDs of modules imported by this module
  dependents: Set<string>; // IDs of modules importing this module
  hash?: string; // Content hash
  lastModified?: number;
  isEntry?: boolean;
}

export interface PackOptions {
  projectRoot?: string;
  appDir?: string;
  outDir?: string;
  mode?: 'development' | 'production';
  minify?: boolean;
  sourcemap?: boolean;
}

export interface BuildStats {
  duration: number;
  modulesCount: number;
  chunksCount: number;
  cacheHits: number;
  cacheMisses: number;
  serverModulesCount: number;
  clientModulesCount: number;
  sharedModulesCount: number;
  initialJsSize: number;
  asyncJsSize: number;
}

export interface TransformResult {
  code: string;
  map?: string;
  imports: string[];
  type: ModuleType;
  hash: string;
}

export interface CacheEntry {
  hash: string;
  code: string;
  map?: string;
  imports: string[];
  type: ModuleType;
  timestamp: number;
}

export interface BoundaryViolation {
  clientModule: string;
  serverModule: string;
  importStatement?: string;
}
