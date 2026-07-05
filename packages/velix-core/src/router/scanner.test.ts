import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { scanAppDirectory } from './scanner.js';
import path from 'path';

// Mock fs.promises.readdir
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readdir: vi.fn(),
    }
  }
}));

// Mock utils
vi.mock('../utils.js', () => ({
  isServerComponent: vi.fn().mockReturnValue(true),
  isClientComponent: vi.fn().mockReturnValue(false),
  isIsland: vi.fn().mockReturnValue(false),
}));

describe('Router Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scans app directory asynchronously without blocking', async () => {
    const mockedReaddir = fs.promises.readdir as any;
    
    mockedReaddir.mockImplementation(async (dir: string) => {
      if (dir === 'app') {
        return [
          { name: 'page.tsx', isFile: () => true, isDirectory: () => false },
          { name: 'about', isFile: () => false, isDirectory: () => true },
          { name: 'node_modules', isFile: () => false, isDirectory: () => true },
          { name: '.velix', isFile: () => false, isDirectory: () => true }
        ];
      }
      if (dir === path.join('app', 'about')) {
        return [
          { name: 'page.tsx', isFile: () => true, isDirectory: () => false }
        ];
      }
      return [];
    });

    const start = performance.now();
    const routes = await scanAppDirectory('app', 'app');
    const end = performance.now();

    expect(routes.length).toBe(2);
    expect(routes.find(r => r.path === '/')).toBeDefined();
    expect(routes.find(r => r.path === '/about')).toBeDefined();
    
    // Ignored directories check
    expect(mockedReaddir).not.toHaveBeenCalledWith(path.join('app', 'node_modules'), expect.anything());
    expect(mockedReaddir).not.toHaveBeenCalledWith(path.join('app', '.velix'), expect.anything());

    // Should be reasonably fast
    expect(end - start).toBeLessThan(100);
  });
});
