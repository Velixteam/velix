import path from 'path';
import { ModuleNode, BoundaryViolation } from '../types.js';

/**
 * Checks if a module is classified as server-only by convention or path
 */
export function isServerModule(filePath: string, content?: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/server/') || normalized.startsWith('server/')) return true;
  if (content) {
    const firstLines = content.split('\n').slice(0, 5).map(l => l.trim());
    if (firstLines.some(l => l === "'use server'" || l === '"use server"')) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a module is classified as client-only
 */
export function isClientModule(filePath: string, content?: string): boolean {
  if (content) {
    const firstLines = content.split('\n').slice(0, 5).map(l => l.trim());
    if (firstLines.some(l => l === "'use client'" || l === '"use client"' || l === "'use island'" || l === '"use island"')) {
      return true;
    }
  }
  return false;
}

/**
 * Validates server/client boundary rules across the module graph
 */
export function checkBoundaryViolations(modules: Map<string, ModuleNode>): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

  for (const [id, mod] of modules.entries()) {
    if (mod.type === 'client') {
      for (const depId of mod.dependencies) {
        const dep = modules.get(depId);
        if (dep && dep.type === 'server') {
          violations.push({
            clientModule: id,
            serverModule: depId,
            importStatement: `Import of server module "${depId}" from client module "${id}"`,
          });
        }
      }
    }
  }

  return violations;
}
