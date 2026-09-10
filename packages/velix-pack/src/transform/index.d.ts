import { Resolver } from '../resolver/index.js';
import { TransformResult } from '../types.js';
export declare class TransformPipeline {
    private resolver;
    constructor(resolver: Resolver);
    transform(filePath: string): Promise<TransformResult>;
}
//# sourceMappingURL=index.d.ts.map