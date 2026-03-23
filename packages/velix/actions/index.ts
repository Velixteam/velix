/**
 * Velix v5 Server Actions
 *
 * React 19 native actions with Velix enhancements and security.
 */

export { useActionState, useOptimistic } from 'react';
export { useFormStatus } from 'react-dom';

import { cookies, headers, redirect, notFound, RedirectError, NotFoundError } from '../helpers.js';

// Global action registry
declare global {
  var __VELIX_ACTIONS__: Record<string, ServerActionFunction>;
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

export type ServerActionFunction = (...args: any[]) => Promise<any>;

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  redirect?: string;
}

/**
 * Decorator to mark a function as a server action
 */
export function serverAction<T extends ServerActionFunction>(fn: T, actionId?: string): T {
  const id = actionId || `action_${fn.name}_${generateActionId()}`;
  globalThis.__VELIX_ACTIONS__[id] = fn;

  const proxy = (async (...args: any[]) => {
    if (typeof window === 'undefined') return await executeAction(id, args);
    return await callServerAction(id, args);
  }) as T;

  (proxy as any).$$typeof = Symbol.for('react.server.action');
  (proxy as any).$$id = id;
  (proxy as any).$$bound = null;
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
export async function executeAction(actionId: string, args: any[], context?: Partial<ActionContext>): Promise<ActionResult> {
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
  } catch (error: any) {
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
export async function callServerAction(actionId: string, args: any[]): Promise<ActionResult> {
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
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

function serializeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (arg instanceof FormData) {
      const obj: Record<string, any> = {};
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

function validateInput(obj: any, depth = 0): boolean {
  if (depth > MAX_DEPTH) throw new Error('Payload too deeply nested');
  if (obj === null || obj === undefined || typeof obj !== 'object') return true;
  if ('__proto__' in obj || 'constructor' in obj || 'prototype' in obj) {
    throw new Error('Invalid payload: prototype pollution attempt detected');
  }
  if ('$$type' in obj && !ALLOWED_TYPES.has(obj.$$type)) {
    throw new Error(`Invalid serialized type: ${obj.$$type}`);
  }
  if (Array.isArray(obj)) obj.forEach(item => validateInput(item, depth + 1));
  else Object.values(obj).forEach(val => validateInput(val, depth + 1));
  return true;
}

export function deserializeArgs(args: any[]): any[] {
  validateInput(args);
  return args.map(arg => {
    if (arg && typeof arg === 'object') {
      if (arg.$$type === 'FormData') {
        const fd = new FormData();
        for (const [key, value] of Object.entries(arg.data || {})) {
          if (typeof key !== 'string' || key.startsWith('__')) continue;
          if (Array.isArray(value)) value.forEach(v => { if (typeof v === 'string' || typeof v === 'number') fd.append(key, String(v)); });
          else if (typeof value === 'string' || typeof value === 'number') fd.append(key, String(value));
        }
        return fd;
      }
      if (arg.$$type === 'Date') { const d = new Date(arg.value); if (isNaN(d.getTime())) throw new Error('Invalid date'); return d; }
      if (arg.$$type === 'File') return { name: String(arg.name || ''), type: String(arg.type || ''), size: Number(arg.size || 0) };
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
    } catch (error: any) {
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

export function bindArgs<T extends ServerActionFunction>(action: T, ...boundArgs: any[]): T {
  const bound = (async (...args: any[]) => await (action as any)(...boundArgs, ...args)) as T;
  (bound as any).$$typeof = (action as any).$$typeof;
  (bound as any).$$id = (action as any).$$id;
  (bound as any).$$bound = boundArgs;
  return bound;
}
