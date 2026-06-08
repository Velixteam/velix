/**
 * Velix v5 Server Actions
 *
 * React 19 native actions with Velix enhancements and security.
 */

export { useActionState, useOptimistic } from 'react';
export { useFormStatus } from 'react-dom';

import { cookies, headers, redirect, notFound, RedirectError, NotFoundError } from './helpers.js';

// Global action registry
declare global {
  var __VELIX_ACTIONS__: Record<string, ServerActionFunction>;
  // @ts-ignore
  var __VELIX_ACTION_CONTEXT__: ActionContext | null;
}

globalThis.__VELIX_ACTIONS__ = globalThis.__VELIX_ACTIONS__ || {};
globalThis.__VELIX_ACTION_CONTEXT__ = null;

export interface ActionContext {
  request: Request;
  cookies: typeof cookies;
  headers: typeof headers;
  redirect: typeof redirect;
  notFound: typeof notFound;
}

export type ServerActionFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (...args: TArgs) => Promise<TReturn>;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  redirect?: string;
}

/**
 * Decorator to mark a function as a server action
 */
export function serverAction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>, 
  actionId?: string
): (...args: TArgs) => Promise<ActionResult<TReturn>> {
  const id = actionId || `action_${fn.name}_${generateActionId()}`;
  globalThis.__VELIX_ACTIONS__[id] = fn as ServerActionFunction;

  const proxy = (async (...args: TArgs) => {
    if (typeof window === 'undefined') return await executeAction(id, args) as ActionResult<TReturn>;
    return await callServerAction(id, args) as ActionResult<TReturn>;
  });

  (proxy as unknown as { $$typeof: symbol }).$$typeof = Symbol.for('react.server.action');
  (proxy as unknown as { $$id: string }).$$id = id;
  (proxy as unknown as { $$bound: unknown }).$$bound = null;
  return proxy;
}

export function registerAction(id: string, fn: ServerActionFunction): void {
  globalThis.__VELIX_ACTIONS__[id] = fn;
}

export function getAction(id: string): ServerActionFunction | undefined {
  return globalThis.__VELIX_ACTIONS__[id];
}

/**
 * Execute a server action on the server
 */
export async function executeAction(actionId: string, args: unknown[], context?: Partial<ActionContext>): Promise<ActionResult> {
  const action = globalThis.__VELIX_ACTIONS__[actionId];
  if (!action) return { success: false, error: `Server action not found: ${actionId}` };

  const actionContext: ActionContext = {
    request: context?.request || new Request('http://localhost'),
    cookies, headers, redirect, notFound
  };

  globalThis.__VELIX_ACTION_CONTEXT__ = actionContext;

  try {
    const result = await action(...args);
    return { success: true, data: result };
  } catch (err: unknown) {
    const error = err as Error;
    if (error instanceof RedirectError) return { success: true, redirect: error.url };
    if (error instanceof NotFoundError) return { success: false, error: 'Not found' };
    return { success: false, error: error.message || 'Action failed' };
  } finally {
    globalThis.__VELIX_ACTION_CONTEXT__ = null;
  }
}

/**
 * Call a server action from the client
 */
export async function callServerAction(actionId: string, args: unknown[]): Promise<ActionResult> {
  try {
    const response = await fetch('/__velix/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Velix-Action': actionId },
      body: JSON.stringify({ actionId, args: serializeArgs(args) }),
      credentials: 'same-origin'
    });

    if (!response.ok) throw new Error(`Action failed: ${response.statusText}`);
    const result = await response.json();
    if (result.redirect) { window.location.href = result.redirect; }
    return result;
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || 'Network error' };
  }
}

function serializeArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (arg instanceof FormData) {
      const obj: Record<string, unknown> = {};
      arg.forEach((value, key) => {
        if (obj[key]) {
          obj[key] = Array.isArray(obj[key]) ? [...obj[key], value] : [obj[key], value];
        } else { obj[key] = value; }
      });
      return { $$type: 'FormData', data: obj };
    }
    if (arg instanceof Date) return { $$type: 'Date', value: arg.toISOString() };
    if (typeof arg === 'object' && arg !== null) return JSON.parse(JSON.stringify(arg));
    return arg;
  });
}

// Security validation
const ALLOWED_TYPES = new Set(['FormData', 'Date', 'File']);
const MAX_DEPTH = 10;

function validateInput(obj: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) throw new Error('Payload too deeply nested');
  if (obj === null || obj === undefined || typeof obj !== 'object') return true;
  if ('__proto__' in obj || 'constructor' in obj || 'prototype' in obj) {
    throw new Error('Invalid payload: prototype pollution attempt detected');
  }
  if ('$$type' in (obj as Record<string, unknown>) && !ALLOWED_TYPES.has((obj as { $$type: string }).$$type)) {
    throw new Error(`Invalid serialized type: ${(obj as { $$type: string }).$$type}`);
  }
  if (Array.isArray(obj)) (obj as unknown[]).forEach(item => validateInput(item, depth + 1));
  else Object.values(obj as Record<string, unknown>).forEach(val => validateInput(val, depth + 1));
  return true;
}

export function deserializeArgs(args: unknown[]): unknown[] {
  validateInput(args);
  return args.map(arg => {
    if (arg && typeof arg === 'object') {
      if ((arg as { $$type?: string }).$$type === 'FormData') {
        const fd = new FormData();
        for (const [key, value] of Object.entries((arg as { data?: Record<string, unknown> }).data || {})) {
          if (typeof key !== 'string' || key.startsWith('__')) continue;
          if (Array.isArray(value)) value.forEach(v => { if (typeof v === 'string' || typeof v === 'number') fd.append(key, String(v)); });
          else if (typeof value === 'string' || typeof value === 'number') fd.append(key, String(value));
        }
        return fd;
      }
      if ((arg as { $$type?: string }).$$type === 'Date') { const d = new Date((arg as { value: string }).value); if (isNaN(d.getTime())) throw new Error('Invalid date'); return d; }
      if ((arg as { $$type?: string }).$$type === 'File') return { name: String((arg as { name?: string }).name || ''), type: String((arg as { type?: string }).type || ''), size: Number((arg as { size?: number }).size || 0) };
    }
    return arg;
  });
}

function generateActionId(): string { return Math.random().toString(36).substring(2, 10); }

export function useActionContext(): ActionContext | null { return globalThis.__VELIX_ACTION_CONTEXT__; }

export function formAction<T>(action: (formData: FormData) => Promise<T>): (formData: FormData) => Promise<ActionResult<T>> {
  return async (formData: FormData) => {
    try {
      const result = await action(formData);
      return { success: true, data: result };
    } catch (err: unknown) {
      const error = err as Error;
      if (error instanceof RedirectError) return { success: true, redirect: error.url };
      return { success: false, error: error.message };
    }
  };
}

import { useActionState as useActionStateReact } from 'react';

export function useVelixAction<State, Payload>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>,
  permalink?: string
): [state: Awaited<State>, dispatch: (payload: Payload) => void, isPending: boolean] {
  return useActionStateReact(action, initialState, permalink);
}

export function bindArgs<TArgs extends unknown[], TBound extends unknown[], TReturn>(
  action: (...args: [...TBound, ...TArgs]) => Promise<ActionResult<TReturn>>, 
  ...boundArgs: TBound
): (...args: TArgs) => Promise<ActionResult<TReturn>> {
  const bound = (async (...args: TArgs) => await action(...boundArgs, ...args));
  (bound as unknown as { $$typeof: symbol }).$$typeof = (action as unknown as { $$typeof: symbol }).$$typeof;
  (bound as unknown as { $$id: string }).$$id = (action as unknown as { $$id: string }).$$id;
  (bound as unknown as { $$bound: unknown[] }).$$bound = boundArgs;
  return bound;
}
