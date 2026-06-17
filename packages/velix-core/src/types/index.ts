import type { ActionResult } from '../server/server-action.js';

export type InferLoaderData<T> =
  T extends (...args: any[]) => Promise<{ data: infer D }> ? D : never;

export type InferActionInput<T> =
  T extends (input: infer I, ...args: any[]) => any ? I : never;

export type InferActionOutput<T> =
  T extends (...args: any[]) => Promise<ActionResult<infer O>> ? O : never;
