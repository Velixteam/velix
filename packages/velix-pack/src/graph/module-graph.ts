import path from 'path';
import { Module } from './module.js';
import { ModuleNode, ModuleType, BoundaryViolation } from '../types.js';
import { checkBoundaryViolations } from './boundary.js';

export class ModuleGraph {
  private modules: Map<string, Module> = new Map();
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public getModule(id: string): Module | undefined {
    return this.modules.get(id);
  }

  public getModuleByPath(filePath: string): Module | undefined {
    const id = this.toRelativeId(filePath);
    return this.modules.get(id);
  }

  public addModule(filePath: string, type: ModuleType = 'shared'): Module {
    const id = this.toRelativeId(filePath);
    let mod = this.modules.get(id);
    if (!mod) {
      mod = new Module(id, filePath, type);
      this.modules.set(id, mod);
    } else {
      mod.type = type;
    }
    return mod;
  }

  public removeModule(filePath: string): Set<string> {
    const id = this.toRelativeId(filePath);
    const mod = this.modules.get(id);
    const affectedDependents = new Set<string>();

    if (mod) {
      // Collect dependents
      for (const depId of mod.dependents) {
        affectedDependents.add(depId);
        const depMod = this.modules.get(depId);
        if (depMod) {
          depMod.removeDependency(id);
        }
      }

      // Cleanup dependencies
      for (const depId of mod.dependencies) {
        const depMod = this.modules.get(depId);
        if (depMod) {
          depMod.removeDependent(id);
        }
      }

      this.modules.delete(id);
    }

    return affectedDependents;
  }

  public updateDependencies(filePath: string, dependencyPaths: string[]): void {
    const id = this.toRelativeId(filePath);
    const mod = this.getModule(id);
    if (!mod) return;

    const newDepIds = new Set(dependencyPaths.map(p => this.toRelativeId(p)));

    // Remove old dependencies no longer imported
    for (const oldDepId of Array.from(mod.dependencies)) {
      if (!newDepIds.has(oldDepId)) {
        mod.removeDependency(oldDepId);
        const depMod = this.modules.get(oldDepId);
        if (depMod) {
          depMod.removeDependent(id);
        }
      }
    }

    // Add new dependencies
    for (const newDepId of newDepIds) {
      if (!mod.dependencies.has(newDepId)) {
        mod.addDependency(newDepId);
        const depMod = this.modules.get(newDepId);
        if (depMod) {
          depMod.addDependent(id);
        }
      }
    }
  }

  /**
   * Finds all affected modules recursively when a file changes
   */
  public getAffectedModules(filePath: string): Set<string> {
    const startId = this.toRelativeId(filePath);
    const affected = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!affected.has(currentId)) {
        affected.add(currentId);
        const mod = this.modules.get(currentId);
        if (mod) {
          for (const dependentId of mod.dependents) {
            queue.push(dependentId);
          }
        }
      }
    }

    return affected;
  }

  public getAllModules(): Map<string, Module> {
    return this.modules;
  }

  public checkBoundaries(): BoundaryViolation[] {
    return checkBoundaryViolations(this.modules);
  }

  public toRelativeId(filePath: string): string {
    const relative = path.relative(this.projectRoot, filePath);
    return relative.replace(/\\/g, '/');
  }

  public clear(): void {
    this.modules.clear();
  }
}
