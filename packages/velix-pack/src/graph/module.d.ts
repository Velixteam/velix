import { ModuleNode, ModuleType } from '../types.js';
export declare class Module implements ModuleNode {
    id: string;
    path: string;
    type: ModuleType;
    dependencies: Set<string>;
    dependents: Set<string>;
    hash?: string;
    lastModified?: number;
    isEntry?: boolean;
    constructor(id: string, path: string, type?: ModuleType);
    addDependency(depId: string): void;
    removeDependency(depId: string): void;
    addDependent(dependentId: string): void;
    removeDependent(dependentId: string): void;
}
//# sourceMappingURL=module.d.ts.map