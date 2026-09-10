import { ModuleGraph } from '../graph/module-graph.js';
import { Chunk } from './chunk.js';
export interface BundlerOptions {
    projectRoot: string;
    outDir: string;
    minify?: boolean;
    sourcemap?: boolean;
}
export declare class Bundler {
    private projectRoot;
    private outDir;
    private minify;
    private sourcemap;
    constructor(options: BundlerOptions);
    bundle(moduleGraph: ModuleGraph): Promise<Chunk[]>;
}
//# sourceMappingURL=index.d.ts.map