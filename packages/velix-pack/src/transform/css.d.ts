import { ModuleType } from '../types.js';
export interface TransformResultCSS {
    code: string;
    imports: string[];
    type: ModuleType;
}
export declare function transformCSS(filePath: string, content: string): Promise<TransformResultCSS>;
//# sourceMappingURL=css.d.ts.map