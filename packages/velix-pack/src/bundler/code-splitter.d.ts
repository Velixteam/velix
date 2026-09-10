import { ModuleGraph } from '../graph/module-graph.js';
import { Chunk } from './chunk.js';
export declare class CodeSplitter {
    private moduleGraph;
    constructor(moduleGraph: ModuleGraph);
    splitIntoChunks(): Chunk[];
}
//# sourceMappingURL=code-splitter.d.ts.map