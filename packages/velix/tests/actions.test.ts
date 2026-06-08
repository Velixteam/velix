import { describe, it, expect, beforeEach } from 'vitest';
import { serverAction, executeAction } from '../actions/index.js';

describe('Server Actions', () => {
  beforeEach(() => {
    globalThis.__VELIX_ACTIONS__ = {};
  });

  describe('serverAction', () => {
    it('should register a server action and return a proxy', () => {
      const fn = async (name: string) => `Hello ${name}`;
      const action = serverAction(fn, 'test_action');

      expect((action as any).$$typeof).toBeDefined();
      expect((action as any).$$id).toBe('test_action');
      expect(globalThis.__VELIX_ACTIONS__['test_action']).toBeDefined();
    });
  });

  describe('executeAction', () => {
    it('should successfully execute a registered action', async () => {
      const fn = async (a: number, b: number) => a + b;
      serverAction(fn, 'add');

      const result = await executeAction('add', [2, 3]);
      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
    });

    it('should handle action errors gracefully', async () => {
      const fn = async () => { throw new Error('Test error'); };
      serverAction(fn, 'error_action');

      const result = await executeAction('error_action', []);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('should return error for unknown actions', async () => {
      const result = await executeAction('unknown_action', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
