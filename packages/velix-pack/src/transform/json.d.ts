import { ModuleType } from '../types.js';
export interface TransformResultJSON {
    code: string;
    imports: string[];
    type: ModuleType;
}
export declare function transformJSON(filePath: string, content: string): Promise<TransformResultJSON>;
//# sourceMappingURL=json.d.ts.map