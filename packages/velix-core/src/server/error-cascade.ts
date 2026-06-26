import path from 'path';
import fs from 'fs';
import { NotFoundError, VelixHttpError } from './errors.js';

export type ErrorBoundaryType = 'error' | 'not-found';

export interface ResolvedBoundary {
  filePath: string;
  type: ErrorBoundaryType;
  scope: string;
}

export function getErrorBoundaryType(error: unknown): ErrorBoundaryType {
  if (error instanceof NotFoundError) return 'not-found';
  if (error instanceof VelixHttpError && error.status === 404) return 'not-found';
  return 'error';
}

export function resolveErrorBoundary(routeFilePath: string, appDir: string, type: ErrorBoundaryType): ResolvedBoundary | null {
  let currentDir = path.dirname(routeFilePath);
  
  // Ensure we don't go outside appDir
  while (currentDir.length >= appDir.length && currentDir.startsWith(appDir)) {
    const boundaryPath = path.join(currentDir, `${type}.tsx`);
    if (fs.existsSync(boundaryPath)) {
      const scope = currentDir === appDir ? 'root' : path.basename(currentDir);
      return {
        filePath: boundaryPath,
        type,
        scope
      };
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  return null;
}
