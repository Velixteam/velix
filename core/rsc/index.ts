/**
 * FlexiReact React Server Components (RSC) System
 * 
 * RSC allows components to run exclusively on the server, reducing client bundle size
 * and enabling direct database/filesystem access in components.
 * 
 * Usage:
 * - Add 'use server' at the top of a component file to make it a Server Component
 * - Add 'use client' at the top to make it a Client Component (hydrated on client)
 * - Server Components can import Client Components, but not vice versa
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { isServerComponent, isClientComponent } from '../utils.js';

/**
 * RSC Payload format for streaming
 */
export const RSC_CONTENT_TYPE = 'text/x-component';

/**
 * Processes a component tree for RSC
 * Server components are rendered to HTML, client components are serialized
 */
export async function processServerComponent(Component: any, props: any, context: any) {
  const componentInfo: {
    isServer: boolean;
    rendered: string | null;
    clientComponents: any[];
    serverData: Record<string, any>;
  } = {
    isServer: true,
    rendered: null,
    clientComponents: [],
    serverData: {}
  };

  try {
    // If component has async data fetching
    if (Component.getServerData) {
      componentInfo.serverData = await Component.getServerData(context);
      props = { ...props, ...componentInfo.serverData };
    }

    // Render the server component
    const element = React.createElement(Component, props);
    componentInfo.rendered = renderToString(element);

  } catch (error) {
    console.error('RSC Error:', error);
    throw error;
  }

  return componentInfo;
}

/**
 * Creates a client component reference for RSC payload
 */
export function createClientReference(componentPath: string, props: any) {
  return {
    $$typeof: Symbol.for('react.client.reference'),
    $$id: componentPath,
    $$props: props
  };
}

/**
 * Serializes RSC payload for streaming
 */
export function serializeRSCPayload(componentTree: any) {
  const payload = {
    type: 'rsc',
    tree: serializeNode(componentTree),
    timestamp: Date.now()
  };

  return JSON.stringify(payload);
}

/**
 * Serializes a React node for RSC
 */
function serializeNode(node: any): any {
  if (node === null || node === undefined) {
    return null;
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(serializeNode);
  }

  if (React.isValidElement(node)) {
    const { type, props } = node;

    // Handle client component references
    const typeAny = type as any;
    if (typeAny.$$typeof === Symbol.for('react.client.reference')) {
      return {
        $$type: 'client',
        $$id: typeAny.$$id,
        props: serializeProps(props as Record<string, any>)
      };
    }

    // Handle regular elements
    const typeName = typeof type === 'string' ? type : (typeAny.displayName || typeAny.name || 'Unknown');

    return {
      $$type: 'element',
      type: typeName,
      props: serializeProps(props as Record<string, any>)
    };
  }

  return String(node);
}

/**
 * Serializes props, handling special cases
 */
function serializeProps(props: Record<string, any>) {
  const serialized: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      serialized.children = serializeNode(value);
    } else if (typeof value === 'function') {
      // Functions can't be serialized - mark as client action
      serialized[key] = { $$type: 'action', name: value.name };
    } else if (value instanceof Date) {
      serialized[key] = { $$type: 'date', value: value.toISOString() };
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = JSON.parse(JSON.stringify(value));
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}

/**
 * Server Actions support
 * Allows calling server functions from client components
 */
export function createServerAction(fn: any, actionId: string) {
  // Mark function as server action
  fn.$$typeof = Symbol.for('react.server.action');
  fn.$$id = actionId;
  
  return fn;
}

/**
 * Handles server action invocation
 */
export async function handleServerAction(actionId: string, args: any[], context: any) {
  // Actions are registered during build
  const action = globalThis.__FLEXI_ACTIONS__?.[actionId];
  
  if (!action) {
    throw new Error(`Server action not found: ${actionId}`);
  }

  return await action(...args, context);
}

/**
 * RSC Boundary component
 * Marks the boundary between server and client rendering
 */
export function ServerBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return children;
}

/**
 * Client Boundary component
 * Marks components that should be hydrated on the client
 */
export function ClientBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  // On server, render children normally
  // On client, this will be hydrated
  return React.createElement('div', {
    'data-flexi-client': 'true',
    children
  });
}

export default {
  processServerComponent,
  createClientReference,
  serializeRSCPayload,
  createServerAction,
  handleServerAction,
  ServerBoundary,
  ClientBoundary,
  RSC_CONTENT_TYPE
};
