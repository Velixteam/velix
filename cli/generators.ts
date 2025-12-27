/**
 * FlexiReact CLI Generators
 * Scaffolding commands for rapid development
 */

import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import prompts from 'prompts';

const log = {
  info: (msg: string) => console.log(`  ${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`  ${pc.green('✔')} ${msg}`),
  warn: (msg: string) => console.log(`  ${pc.yellow('⚠')} ${pc.yellow(msg)}`),
  error: (msg: string) => console.log(`  ${pc.red('✖')} ${pc.red(msg)}`),
  blank: () => console.log(''),
};

// ============================================================================
// Templates
// ============================================================================

const templates = {
  // Page template
  page: (name: string, options: { client?: boolean }) => `${options.client ? "'use client';\n\n" : ''}import React from 'react';

export default function ${toPascalCase(name)}Page() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">${toPascalCase(name)}</h1>
      <p className="text-gray-400 mt-4">Welcome to ${name} page</p>
    </div>
  );
}
`,

  // Layout template
  layout: (name: string) => `import React from 'react';

interface ${toPascalCase(name)}LayoutProps {
  children: React.ReactNode;
}

export default function ${toPascalCase(name)}Layout({ children }: ${toPascalCase(name)}LayoutProps) {
  return (
    <div className="${name}-layout">
      {/* Add your layout wrapper here */}
      {children}
    </div>
  );
}
`,

  // Component template
  component: (name: string, options: { client?: boolean; props?: boolean }) => {
    const propsInterface = options.props ? `
interface ${toPascalCase(name)}Props {
  className?: string;
  children?: React.ReactNode;
}
` : '';
    const propsType = options.props ? `{ className, children }: ${toPascalCase(name)}Props` : '{}';

    return `${options.client ? "'use client';\n\n" : ''}import React from 'react';
import { cn } from '@/lib/utils';
${propsInterface}
export function ${toPascalCase(name)}(${propsType}) {
  return (
    <div className={cn('${toKebabCase(name)}', ${options.props ? 'className' : "''"})}>
      ${options.props ? '{children}' : `{/* ${toPascalCase(name)} content */}`}
    </div>
  );
}

export default ${toPascalCase(name)};
`;
  },

  // Hook template
  hook: (name: string) => `import { useState, useEffect, useCallback } from 'react';

export function use${toPascalCase(name)}() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Add your logic here
      setState(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, execute };
}

export default use${toPascalCase(name)};
`,

  // API route template
  api: (name: string) => `import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
}

async function handleGet(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: '${name} API - GET' }));
}

async function handlePost(req: IncomingMessage, res: ServerResponse) {
  // Parse body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  const data = body ? JSON.parse(body) : {};

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: '${name} API - POST', data }));
}
`,

  // Server Action template
  action: (name: string) => `'use server';

import { revalidatePath } from '@flexireact/core';

export async function ${toCamelCase(name)}Action(formData: FormData) {
  // Validate input
  const data = Object.fromEntries(formData);
  
  try {
    // Add your server logic here
    console.log('${toPascalCase(name)} action executed:', data);
    
    // Revalidate cache if needed
    // revalidatePath('/');
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
`,

  // Middleware template
  middleware: (name: string) => `import type { IncomingMessage, ServerResponse } from 'http';

export interface ${toPascalCase(name)}MiddlewareOptions {
  // Add your options here
}

export function ${toCamelCase(name)}Middleware(options: ${toPascalCase(name)}MiddlewareOptions = {}) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => Promise<void>
  ) => {
    // Before request handling
    console.log('[${toPascalCase(name)}] Request:', req.url);
    
    // Continue to next middleware/handler
    await next();
    
    // After request handling (optional)
  };
}

export default ${toCamelCase(name)}Middleware;
`,

  // Context template
  context: (name: string) => `'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ${toPascalCase(name)}State {
  // Add your state properties here
  value: string | null;
}

interface ${toPascalCase(name)}ContextValue extends ${toPascalCase(name)}State {
  setValue: (value: string) => void;
  reset: () => void;
}

const ${toPascalCase(name)}Context = createContext<${toPascalCase(name)}ContextValue | null>(null);

export function ${toPascalCase(name)}Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<${toPascalCase(name)}State>({
    value: null,
  });

  const setValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, value }));
  }, []);

  const reset = useCallback(() => {
    setState({ value: null });
  }, []);

  return (
    <${toPascalCase(name)}Context.Provider value={{ ...state, setValue, reset }}>
      {children}
    </${toPascalCase(name)}Context.Provider>
  );
}

export function use${toPascalCase(name)}() {
  const context = useContext(${toPascalCase(name)}Context);
  if (!context) {
    throw new Error('use${toPascalCase(name)} must be used within a ${toPascalCase(name)}Provider');
  }
  return context;
}
`,

  // Loading template
  loading: () => `import React from 'react';
import { Spinner } from '@flexireact/flexi-ui';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
`,

  // Error template
  error: () => `'use client';

import React from 'react';
import { Button, Alert } from '@flexireact/flexi-ui';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <Alert variant="error" className="max-w-md mb-8">
        <h2 className="font-bold text-lg mb-2">Something went wrong</h2>
        <p className="text-sm">{error.message}</p>
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
`,

  // Not found template
  notFound: () => `import React from 'react';
import { Button } from '@flexireact/flexi-ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <p className="text-gray-400 text-xl mb-8">Page not found</p>
      <Button asChild>
        <a href="/">← Back Home</a>
      </Button>
    </div>
  );
}
`,
};

// ============================================================================
// Utility Functions
// ============================================================================

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath: string, content: string): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

// ============================================================================
// Generator Commands
// ============================================================================

export type GeneratorType =
  | 'page'
  | 'layout'
  | 'component'
  | 'hook'
  | 'api'
  | 'action'
  | 'middleware'
  | 'context'
  | 'loading'
  | 'error'
  | 'not-found';

export async function runGenerate(type?: string, name?: string): Promise<void> {
  const cwd = process.cwd();

  // Check if we're in a FlexiReact project
  if (!fs.existsSync(path.join(cwd, 'package.json'))) {
    log.error('Not in a FlexiReact project. Run this command in your project root.');
    process.exit(1);
  }

  // Interactive mode if no type provided
  if (!type) {
    const response = await prompts([
      {
        type: 'select',
        name: 'type',
        message: 'What do you want to generate?',
        choices: [
          { title: '📄 Page', value: 'page', description: 'A new page in app/ or pages/' },
          { title: '📐 Layout', value: 'layout', description: 'A layout wrapper component' },
          { title: '🧩 Component', value: 'component', description: 'A reusable React component' },
          { title: '🪝 Hook', value: 'hook', description: 'A custom React hook' },
          { title: '🔌 API Route', value: 'api', description: 'An API endpoint' },
          { title: '⚡ Server Action', value: 'action', description: 'A server action function' },
          { title: '🛡️ Middleware', value: 'middleware', description: 'Request middleware' },
          { title: '🌐 Context', value: 'context', description: 'React context provider' },
          { title: '⏳ Loading', value: 'loading', description: 'Loading state component' },
          { title: '❌ Error', value: 'error', description: 'Error boundary component' },
          { title: '🔍 Not Found', value: 'not-found', description: '404 page component' },
        ],
      },
      {
        type: (prev) => ['loading', 'error', 'not-found'].includes(prev) ? null : 'text',
        name: 'name',
        message: 'Name:',
        validate: (v: string) => v.length > 0 || 'Name is required',
      },
    ]);

    if (!response.type) process.exit(0);
    type = response.type;
    name = response.name;
  }

  // Validate type
  const validTypes: GeneratorType[] = [
    'page', 'layout', 'component', 'hook', 'api',
    'action', 'middleware', 'context', 'loading', 'error', 'not-found'
  ];

  if (!validTypes.includes(type as GeneratorType)) {
    log.error(`Invalid type: ${type}`);
    log.info(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Special types that don't need a name
  if (type && ['loading', 'error', 'not-found'].includes(type)) {
    await generateSpecialFile(type as 'loading' | 'error' | 'not-found', cwd);
    return;
  }

  // Get name if not provided
  let finalName = name;
  if (!finalName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: `${toPascalCase(type || 'item')} name:`,
      validate: (v: string) => v.length > 0 || 'Name is required',
    });
    finalName = response.name;
    if (!finalName) process.exit(0);
  }

  // Generate based on type
  switch (type) {
    case 'page':
      await generatePage(finalName, cwd);
      break;
    case 'layout':
      await generateLayout(finalName, cwd);
      break;
    case 'component':
      await generateComponent(finalName, cwd);
      break;
    case 'hook':
      await generateHook(finalName, cwd);
      break;
    case 'api':
      await generateApi(finalName, cwd);
      break;
    case 'action':
      await generateAction(finalName, cwd);
      break;
    case 'middleware':
      await generateMiddleware(finalName, cwd);
      break;
    case 'context':
      await generateContext(finalName, cwd);
      break;
  }
}

async function generatePage(name: string, cwd: string): Promise<void> {
  const response = await prompts([
    {
      type: 'select',
      name: 'directory',
      message: 'Where to create the page?',
      choices: [
        { title: 'app/ (App Router)', value: 'app' },
        { title: 'pages/ (Pages Router)', value: 'pages' },
      ],
    },
    {
      type: 'toggle',
      name: 'client',
      message: 'Client component? (use client)',
      initial: false,
      active: 'Yes',
      inactive: 'No',
    },
  ]);

  const fileName = response.directory === 'app' ? 'page.tsx' : `${toKebabCase(name)}.tsx`;
  const filePath = response.directory === 'app'
    ? path.join(cwd, 'app', toKebabCase(name), fileName)
    : path.join(cwd, 'pages', fileName);

  writeFile(filePath, templates.page(name, { client: response.client }));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateLayout(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'app', toKebabCase(name), 'layout.tsx');
  writeFile(filePath, templates.layout(name));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateComponent(name: string, cwd: string): Promise<void> {
  const response = await prompts([
    {
      type: 'select',
      name: 'directory',
      message: 'Where to create the component?',
      choices: [
        { title: 'components/', value: 'components' },
        { title: 'app/components/', value: 'app/components' },
      ],
    },
    {
      type: 'toggle',
      name: 'client',
      message: 'Client component?',
      initial: true,
      active: 'Yes',
      inactive: 'No',
    },
    {
      type: 'toggle',
      name: 'props',
      message: 'Include props interface?',
      initial: true,
      active: 'Yes',
      inactive: 'No',
    },
  ]);

  const filePath = path.join(cwd, response.directory, `${toPascalCase(name)}.tsx`);
  writeFile(filePath, templates.component(name, { client: response.client, props: response.props }));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateHook(name: string, cwd: string): Promise<void> {
  const hookName = name.startsWith('use') ? name : `use-${name}`;
  const filePath = path.join(cwd, 'hooks', `${toKebabCase(hookName)}.ts`);
  writeFile(filePath, templates.hook(hookName.replace(/^use-?/, '')));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateApi(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'pages', 'api', `${toKebabCase(name)}.ts`);
  writeFile(filePath, templates.api(name));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateAction(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'actions', `${toKebabCase(name)}.ts`);
  writeFile(filePath, templates.action(name));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateMiddleware(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'middleware', `${toKebabCase(name)}.ts`);
  writeFile(filePath, templates.middleware(name));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateContext(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'contexts', `${toPascalCase(name)}Context.tsx`);
  writeFile(filePath, templates.context(name));
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

async function generateSpecialFile(type: 'loading' | 'error' | 'not-found', cwd: string): Promise<void> {
  const response = await prompts({
    type: 'text',
    name: 'path',
    message: 'Path (relative to app/):',
    initial: '',
  });

  const basePath = response.path ? path.join(cwd, 'app', response.path) : path.join(cwd, 'app');

  let fileName: string;
  let content: string;

  switch (type) {
    case 'loading':
      fileName = 'loading.tsx';
      content = templates.loading();
      break;
    case 'error':
      fileName = 'error.tsx';
      content = templates.error();
      break;
    case 'not-found':
      fileName = 'not-found.tsx';
      content = templates.notFound();
      break;
  }

  const filePath = path.join(basePath, fileName);
  writeFile(filePath, content);
  log.success(`Created ${pc.cyan(path.relative(cwd, filePath))}`);
}

// ============================================================================
// List Generators
// ============================================================================

export function listGenerators(): void {
  console.log(`  ${pc.bold('Available Generators')}`);
  log.blank();

  console.log(`    ${pc.cyan('page')}        ${pc.dim('Create a new page')}`);
  console.log(`    ${pc.cyan('layout')}      ${pc.dim('Create a layout wrapper')}`);
  console.log(`    ${pc.cyan('component')}   ${pc.dim('Create a React component')}`);
  console.log(`    ${pc.cyan('hook')}        ${pc.dim('Create a custom hook')}`);
  console.log(`    ${pc.cyan('api')}         ${pc.dim('Create an API route')}`);
  console.log(`    ${pc.cyan('action')}      ${pc.dim('Create a server action')}`);
  console.log(`    ${pc.cyan('middleware')}  ${pc.dim('Create request middleware')}`);
  log.blank();

  console.log(`  ${pc.bold('Usage')}`);
  console.log(`    $ flexi g <type> [name]`);
  log.blank();
}
