import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { resolveErrorBoundary, getErrorBoundaryType } from '../error-cascade';
import { NotFoundError, VelixHttpError, ForbiddenError } from '../errors';

function mkdirp(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

describe('error-cascade', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ─── resolveErrorBoundary ────────────────────────────────────────────────

  describe('resolveErrorBoundary', () => {
    it('finds error.tsx in the same directory', () => {
      const routeDir = path.join(tmpDir, 'app', 'dashboard');
      mkdirp(routeDir);
      const errorFile = path.join(routeDir, 'error.tsx');
      fs.writeFileSync(errorFile, '// error boundary');
      const routeFile = path.join(routeDir, 'page.tsx');
      fs.writeFileSync(routeFile, '// page');

      const result = resolveErrorBoundary(routeFile, path.join(tmpDir, 'app'), 'error');
      expect(result).not.toBeNull();
      expect(result!.filePath).toBe(errorFile);
      expect(result!.type).toBe('error');
    });

    it('walks up to find root error.tsx when none in segment', () => {
      const appDir = path.join(tmpDir, 'app');
      const deepDir = path.join(appDir, 'dashboard', '123');
      mkdirp(deepDir);

      const rootError = path.join(appDir, 'error.tsx');
      fs.writeFileSync(rootError, '// root error');
      const routeFile = path.join(deepDir, 'page.tsx');
      fs.writeFileSync(routeFile, '// page');

      const result = resolveErrorBoundary(routeFile, appDir, 'error');
      expect(result).not.toBeNull();
      expect(result!.filePath).toBe(rootError);
      expect(result!.scope).toBe('root');
    });

    it('prefers nearest ancestor over root', () => {
      const appDir = path.join(tmpDir, 'app');
      const dashDir = path.join(appDir, 'dashboard');
      const deepDir = path.join(dashDir, '123');
      mkdirp(deepDir);

      fs.writeFileSync(path.join(appDir, 'error.tsx'), '// root error');
      const dashError = path.join(dashDir, 'error.tsx');
      fs.writeFileSync(dashError, '// dashboard error');
      fs.writeFileSync(path.join(deepDir, 'page.tsx'), '// page');

      const result = resolveErrorBoundary(path.join(deepDir, 'page.tsx'), appDir, 'error');
      expect(result!.filePath).toBe(dashError);
    });

    it('returns null when no boundary file found', () => {
      const appDir = path.join(tmpDir, 'app');
      const routeDir = path.join(appDir, 'about');
      mkdirp(routeDir);
      fs.writeFileSync(path.join(routeDir, 'page.tsx'), '// page');

      const result = resolveErrorBoundary(path.join(routeDir, 'page.tsx'), appDir, 'error');
      expect(result).toBeNull();
    });

    it('finds not-found.tsx for type not-found', () => {
      const appDir = path.join(tmpDir, 'app');
      mkdirp(appDir);
      const nfFile = path.join(appDir, 'not-found.tsx');
      fs.writeFileSync(nfFile, '// not found');
      fs.writeFileSync(path.join(appDir, 'page.tsx'), '// page');

      const result = resolveErrorBoundary(path.join(appDir, 'page.tsx'), appDir, 'not-found');
      expect(result!.filePath).toBe(nfFile);
      expect(result!.type).toBe('not-found');
    });
  });

  // ─── getErrorBoundaryType ────────────────────────────────────────────────

  describe('getErrorBoundaryType', () => {
    it('returns not-found for NotFoundError', () => {
      expect(getErrorBoundaryType(new NotFoundError())).toBe('not-found');
    });

    it('returns not-found for VelixHttpError with status 404', () => {
      expect(getErrorBoundaryType(new VelixHttpError(404, 'Not found'))).toBe('not-found');
    });

    it('returns error for ForbiddenError (403)', () => {
      expect(getErrorBoundaryType(new ForbiddenError())).toBe('error');
    });

    it('returns error for a generic Error', () => {
      expect(getErrorBoundaryType(new Error('oops'))).toBe('error');
    });

    it('returns error for a VelixHttpError with status 500', () => {
      expect(getErrorBoundaryType(new VelixHttpError(500, 'crash'))).toBe('error');
    });
  });
});
