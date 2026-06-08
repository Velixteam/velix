import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { loadConfig, resolvePaths } from '../config.js';

// Mock fs and url
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
}));

describe('Config', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('resolvePaths', () => {
    it('should resolve paths relative to project root', () => {
      const root = '/project/root';
      const config = {
        app: { name: 'Test' },
        server: { port: 3000 },
        appDir: 'app',
        publicDir: 'public',
        build: { outDir: 'dist' }
      } as any;

      const resolved = resolvePaths(config, root);
      expect((resolved as any).resolvedAppDir).toBe(path.resolve(root, 'app'));
      expect((resolved as any).resolvedPublicDir).toBe(path.resolve(root, 'public'));
    });
  });

  describe('loadConfig', () => {
    it('should provide default config if no file found', async () => {
      const { default: fs } = await import('fs');
      (fs.existsSync as any).mockReturnValue(false);

      const config = await loadConfig('/empty/project');
      expect(config.app.name).toBe('Velix App');
      expect(config.server.port).toBe(3000);
      expect(config.server.host).toBe('localhost');
      expect(config.routing.trailingSlash).toBe(false);
    });
  });
});
