/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAction } from '../use-action.js';

describe('useAction', () => {
  it('handles successful action execution', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true, data: 'OK' });
    const { result } = renderHook(() => useAction(mockAction));

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeNull();

    let mutatePromise: Promise<any>;
    act(() => {
      mutatePromise = result.current.mutate({} as any);
    });

    // isPending should be true right after calling mutate
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await mutatePromise!;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBe('OK');
    expect(result.current.error).toBeNull();
  });

  it('handles failed action execution', async () => {
    const mockAction = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed',
      fieldErrors: { field: ['err'] },
    });
    const { result } = renderHook(() => useAction(mockAction));

    await act(async () => {
      await result.current.mutate({} as any);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed');
    expect(result.current.fieldErrors).toEqual({ field: ['err'] });
  });

  it('resets state correctly', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true, data: 'OK' });
    const { result } = renderHook(() => useAction(mockAction));

    await act(async () => {
      await result.current.mutate({} as any);
    });

    expect(result.current.data).toBe('OK');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toBeNull();
    expect(result.current.isPending).toBe(false);
  });
});
