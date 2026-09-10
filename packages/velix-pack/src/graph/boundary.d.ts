import { ModuleNode, BoundaryViolation } from '../types.js';
/**
 * Checks if a module is classified as server-only by convention or path
 */
export declare function isServerModule(filePath: string, content?: string): boolean;
/**
 * Checks if a module is classified as client-only
 */
export declare function isClientModule(filePath: string, content?: string): boolean;
/**
 * Validates server/client boundary rules across the module graph
 */
export declare function checkBoundaryViolations(modules: Map<string, ModuleNode>): BoundaryViolation[];
//# sourceMappingURL=boundary.d.ts.map