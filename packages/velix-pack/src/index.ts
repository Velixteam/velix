import path from 'path';
import fs from 'fs';
import { Resolver } from './resolver/index.js';
import { ModuleGraph } from './graph/module-graph.js';
import { TransformPipeline } from './transform/index.js';
import { CacheManager } from './cache/index.js';
import { Bundler } from './bundler/index.js';
import { FileWatcher } from './watcher/index.js';
import { HMRBridge } from './hmr/index.js';
import { formatBuildStats } from './analyzer/index.js';
import { PackOptions, BuildStats } from './types.js';

export * from './types.js';
export { Resolver } from './resolver/index.js';
export { ModuleGraph } from './graph/module-graph.js';
export { CacheManager } from './cache/index.js';
export { formatBuildStats } from './analyzer/index.js';

export class VelixPack {
  private options: Required<PackOptions>;
  private resolver: Resolver;
  private moduleGraph: ModuleGraph;
  private pipeline: TransformPipeline;
  private cache: CacheManager;
  private bundler: Bundler;
  private watcher: FileWatcher | null = null;
  private hmr: HMRBridge = new HMRBridge();
  private stats: BuildStats = {
    duration: 0,
    modulesCount: 0,
    chunksCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    serverModulesCount: 0,
    clientModulesCount: 0,
    sharedModulesCount: 0,
    initialJsSize: 0,
    asyncJsSize: 0,
  };

  constructor(options: PackOptions = {}) {
    const projectRoot = options.projectRoot || process.cwd();
    this.options = {
      projectRoot,
      appDir: options.appDir || path.join(projectRoot, 'app'),
      outDir: options.outDir || path.join(projectRoot, '.velix'),
      mode: options.mode || 'development',
      minify: options.minify ?? false,
      sourcemap: options.sourcemap ?? true,
    };

    this.resolver = new Resolver({ projectRoot });
    this.moduleGraph = new ModuleGraph(projectRoot);
    this.pipeline = new TransformPipeline(this.resolver);
    this.cache = new CacheManager(projectRoot);
    this.bundler = new Bundler({
      projectRoot,
      outDir: this.options.outDir,
      minify: this.options.minify,
      sourcemap: this.options.sourcemap,
    });
  }

  public async build(): Promise<BuildStats> {
    const startTime = Date.now();

    // 1. Discover entries
    const sourceFiles = this.findSourceFiles(this.options.appDir);
    const serverFiles = fs.existsSync(path.join(this.options.projectRoot, 'server'))
      ? this.findSourceFiles(path.join(this.options.projectRoot, 'server'))
      : [];
    const allFiles = Array.from(new Set([...sourceFiles, ...serverFiles]));

    // 2. Build graph & transform modules
    for (const filePath of allFiles) {
      await this.processFile(filePath);
    }

    // 3. Check boundaries
    const violations = this.moduleGraph.checkBoundaries();
    if (violations.length > 0) {
      for (const v of violations) {
        console.error(`ERROR [VELIX_PACK]\nServer module imported from client module.\nclient: ${v.clientModule}\nserver: ${v.serverModule}\n`);
      }
      throw new Error(`[VELIX_PACK] Build failed due to ${violations.length} server/client boundary violation(s).`);
    }

    // 4. Bundle & split chunks
    const chunks = await this.bundler.bundle(this.moduleGraph);

    // 5. Gather statistics
    const cacheStats = this.cache.getStats();
    const modules = Array.from(this.moduleGraph.getAllModules().values());

    this.stats = {
      duration: Date.now() - startTime,
      modulesCount: modules.length,
      chunksCount: chunks.length,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      serverModulesCount: modules.filter(m => m.type === 'server').length,
      clientModulesCount: modules.filter(m => m.type === 'client').length,
      sharedModulesCount: modules.filter(m => m.type === 'shared').length,
      initialJsSize: chunks.filter(c => c.isInitial).reduce((acc, c) => acc + c.size, 0),
      asyncJsSize: chunks.filter(c => !c.isInitial).reduce((acc, c) => acc + c.size, 0),
    };

    return this.stats;
  }

  public watch(onRebuild?: (affectedModules: string[]) => void): FileWatcher {
    const serverDir = path.join(this.options.projectRoot, 'server');
    const watchPaths = [this.options.appDir];
    if (fs.existsSync(serverDir)) watchPaths.push(serverDir);

    this.watcher = new FileWatcher(watchPaths);
    this.watcher.start({
      onChange: async (filePath) => {
        const affected = await this.rebuildIncremental(filePath);
        this.hmr.notifyFileChanged(filePath, Array.from(affected));
        if (onRebuild) onRebuild(Array.from(affected));
      },
      onAdd: async (filePath) => {
        await this.processFile(filePath);
        const affected = this.moduleGraph.getAffectedModules(filePath);
        if (onRebuild) onRebuild(Array.from(affected));
      },
      onUnlink: (filePath) => {
        const affected = this.moduleGraph.removeModule(filePath);
        this.cache.invalidate(this.moduleGraph.toRelativeId(filePath));
        if (onRebuild) onRebuild(Array.from(affected));
      },
    });

    return this.watcher;
  }

  private async rebuildIncremental(filePath: string): Promise<Set<string>> {
    await this.processFile(filePath);
    return this.moduleGraph.getAffectedModules(filePath);
  }

  private processingSet = new Set<string>();

  private async processFile(filePath: string): Promise<void> {
    if (this.processingSet.has(filePath)) return;
    this.processingSet.add(filePath);

    try {
      const relativeId = this.moduleGraph.toRelativeId(filePath);

      // Transform
      const transformResult = await this.pipeline.transform(filePath);

      // Check cache
      let cached = this.cache.get(relativeId, transformResult.hash);
      if (!cached) {
        cached = {
          hash: transformResult.hash,
          code: transformResult.code,
          imports: transformResult.imports,
          type: transformResult.type,
          timestamp: Date.now(),
        };
        this.cache.set(relativeId, cached);
      }

      // Add to graph
      const mod = this.moduleGraph.addModule(filePath, transformResult.type);
      mod.hash = transformResult.hash;

      // Update dependencies graph
      this.moduleGraph.updateDependencies(filePath, transformResult.imports);

      // Recursively process unvisited imports
      for (const importPath of transformResult.imports) {
        if (!this.moduleGraph.getModuleByPath(importPath)) {
          if (fs.existsSync(importPath)) {
            await this.processFile(importPath);
          }
        }
      }
    } finally {
      this.processingSet.delete(filePath);
    }
  }

  private findSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.velix' && entry.name !== 'dist') {
          results.push(...this.findSourceFiles(fullPath));
        }
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }

    return results;
  }

  public getHMR(): HMRBridge {
    return this.hmr;
  }

  public getStats(): BuildStats {
    return this.stats;
  }
}
