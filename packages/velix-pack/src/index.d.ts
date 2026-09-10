import { FileWatcher } from './watcher/index.js';
import { HMRBridge } from './hmr/index.js';
import { PackOptions, BuildStats } from './types.js';
export * from './types.js';
export { Resolver } from './resolver/index.js';
export { ModuleGraph } from './graph/module-graph.js';
export { CacheManager } from './cache/index.js';
export { formatBuildStats } from './analyzer/index.js';
export declare class VelixPack {
    private options;
    private resolver;
    private moduleGraph;
    private pipeline;
    private cache;
    private bundler;
    private watcher;
    private hmr;
    private stats;
    constructor(options?: PackOptions);
    build(): Promise<BuildStats>;
    watch(onRebuild?: (affectedModules: string[]) => void): FileWatcher;
    private rebuildIncremental;
    private processFile;
    private findSourceFiles;
    getHMR(): HMRBridge;
    getStats(): BuildStats;
}
//# sourceMappingURL=index.d.ts.map