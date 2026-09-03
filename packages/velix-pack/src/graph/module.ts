import { ModuleNode, ModuleType } from '../types.js';

export class Module implements ModuleNode {
  public id: string;
  public path: string;
  public type: ModuleType;
  public dependencies: Set<string> = new Set();
  public dependents: Set<string> = new Set();
  public hash?: string;
  public lastModified?: number;
  public isEntry?: boolean;

  constructor(id: string, path: string, type: ModuleType = 'shared') {
    this.id = id;
    this.path = path;
    this.type = type;
  }

  public addDependency(depId: string): void {
    this.dependencies.add(depId);
  }

  public removeDependency(depId: string): void {
    this.dependencies.delete(depId);
  }

  public addDependent(dependentId: string): void {
    this.dependents.add(dependentId);
  }

  public removeDependent(dependentId: string): void {
    this.dependents.delete(dependentId);
  }
}
