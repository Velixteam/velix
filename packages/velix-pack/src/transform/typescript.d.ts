import { Resolver } from '../resolver/index.js';
import { ModuleType } from '../types.js';
export interface TransformResultTS {
    code: string;
    map?: string;
    imports: string[];
    type: ModuleType;
}
export declare function transformTypeScript(filePath: string, content: string, resolver: Resolver): Promise<TransformResultTS>;
export declare function extractImports(content: string, filePath: string, resolver: Resolver): string[];
//# sourceMappingURL=typescript.d.ts.map