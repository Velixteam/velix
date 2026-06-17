import { describe, it, expect, vi } from 'vitest';
import { serverAction } from '../server-action.js';
import { z } from 'zod';

describe('serverAction', () => {
  it('returns success and data on successful execution', async () => {
    const action = serverAction({
      input: z.object({ name: z.string() }),
      handler: async ({ input }) => ({ hello: input.name })
    });

    const result = await action({ name: 'World' }, {} as any);
    expect(result).toEqual({ success: true, data: { hello: 'World' } });
  });

  it('returns validation errors on Zod failure', async () => {
    const action = serverAction({
      input: z.object({ name: z.string().min(3) }),
      handler: async () => ({})
    });

    const result = await action({ name: 'Hi' }, {} as any);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Validation failed');
      expect(result.fieldErrors?.name).toBeDefined();
    }
  });

  it('returns error if handler throws', async () => {
    const action = serverAction({
      input: z.object({}),
      handler: async () => { throw new Error('DB Error'); }
    });

    const result = await action({}, {} as any);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('DB Error');
    }
  });
});
