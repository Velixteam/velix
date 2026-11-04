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
    duration: 0, modulesCount: 0, chunksCount: 0, cacheHits: 0, cacheMisses: 0,
    serverModulesCount: 0, clientModulesCount: 0, sharedModulesCount: 0,
    initialJsSize: 0, asyncJsSize: 0,
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
      projectRoot, outDir: this.options.outDir,
      minify: this.options.minify, sourcemap: this.options.sourcemap,
    });
  }

  public async build(): Promise<BuildStats> {
    const startTime = Date.now();
    const sourceFiles = this.findSourceFiles(this.options.appDir);
    const serverDir = path.join(this.options.projectRoot, 'server');
    const serverFiles = fs.existsSync(serverDir) ? this.findSourceFiles(serverDir) : [];
    const allFiles = Array.from(new Set([...sourceFiles, ...serverFiles]));

    for (const filePath of allFiles) await this.processFile(filePath);

    const violations = this.moduleGraph.checkBoundaries();
    if (violations.length > 0) {
      for (const v of violations) {
        console.error(`ERROR [VELIX_PACK]\nServer module imported from client module.\nclient: ${v.clientModule}\nserver: ${v.serverModule}\n`);
      }
      throw new Error(`[VELIX_PACK] Build failed due to ${violations.length} server/client boundary violation(s).`);
    }

    const chunks = await this.bundler.bundle(this.moduleGraph);
    const cacheStats = this.cache.getStats();
    const modules = Array.from(this.moduleGraph.getAllModules().values());
    const outputSizes = this.measureClientOutput();

    this.stats = {
      duration: Date.now() - startTime,
      modulesCount: modules.length,
      // Count emitted JavaScript files, not the splitter's planning objects.
      chunksCount: outputSizes.fileCount,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      serverModulesCount: modules.filter(m => m.type === 'server').length,
      clientModulesCount: modules.filter(m => m.type === 'client').length,
      sharedModulesCount: modules.filter(m => m.type === 'shared').length,
      initialJsSize: outputSizes.initialBytes,
      asyncJsSize: outputSizes.asyncBytes,
    };

    // Keep the splitter result observable through stats while avoiding unused
    // planning data in the public result contract.
    void chunks;
    return this.stats;
  }

  private measureClientOutput(): { fileCount: number; initialBytes: number; asyncBytes: number } {
    const clientDir = path.join(this.options.outDir, 'client');
    const result = { fileCount: 0, initialBytes: 0, asyncBytes: 0 };
    if (!fs.existsSync(clientDir)) return result;

    const visit = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          visit(fullPath);
        } else if (entry.isFile() && /\.(?:m?js)$/i.test(entry.name)) {
          const size = fs.statSync(fullPath).size;
          result.fileCount += 1;
          if (path.relative(clientDir, fullPath).split(path.sep)[0] === 'chunks') {
            result.asyncBytes += size;
          } else {
            result.initialBytes += size;
          }
        }
      }
    };

    visit(clientDir);
    return result;
  }

  public watch(onRebuild?: (affectedModules: string[]) => void): FileWatcher {
    const serverDir = path.join(this.options.projectRoot, 'server');
    const watchPaths = [this.options.appDir];
    if (fs.existsSync(serverDir)) watchPaths.push(serverDir);

    this.watcher = new FileWatcher(watchPaths);
    this.watcher.start({
      onChange: async filePath => {
        const affected = await this.rebuildIncremental(filePath);
        this.hmr.notifyFileChanged(filePath, Array.from(affected));
        if (onRebuild) onRebuild(Array.from(affected));
      },
      onAdd: async filePath => {
        await this.processFile(filePath);
        const affected = this.moduleGraph.getAffectedModules(filePath);
        if (onRebuild) onRebuild(Array.from(affected));
      },
      onUnlink: filePath => {
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
      const transformResult = await this.pipeline.transform(filePath);
      let cached = this.cache.get(relativeId, transformResult.hash);
      if (!cached) {
        cached = {
          hash: transformResult.hash, code: transformResult.code,
          imports: transformResult.imports, type: transformResult.type, timestamp: Date.now(),
        };
        this.cache.set(relativeId, cached);
      }
      const mod = this.moduleGraph.addModule(filePath, transformResult.type);
      mod.hash = transformResult.hash;
      this.moduleGraph.updateDependencies(filePath, transformResult.imports);
      for (const importPath of transformResult.imports) {
        if (!this.moduleGraph.getModuleByPath(importPath) && fs.existsSync(importPath)) {
          await this.processFile(importPath);
        }
      }
    } finally {
      this.processingSet.delete(filePath);
    }
  }

  private findSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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

  public getHMR(): HMRBridge { return this.hmr; }
  public getStats(): BuildStats { return this.stats; }
}
