import { Module } from './module.js';
import { ModuleType, BoundaryViolation } from '../types.js';
export declare class ModuleGraph {
    private modules;
    private projectRoot;
    constructor(projectRoot: string);
    getModule(id: string): Module | undefined;
    getModuleByPath(filePath: string): Module | undefined;
    addModule(filePath: string, type?: ModuleType): Module;
    removeModule(filePath: string): Set<string>;
    updateDependencies(filePath: string, dependencyPaths: string[]): void;
    /**
     * Finds all affected modules recursively when a file changes
     */
    getAffectedModules(filePath: string): Set<string>;
    getAllModules(): Map<string, Module>;
    checkBoundaries(): BoundaryViolation[];
    toRelativeId(filePath: string): string;
    clear(): void;
}
//# sourceMappingURL=module-graph.d.ts.map