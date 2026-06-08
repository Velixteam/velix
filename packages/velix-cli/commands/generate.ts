/**
 * `velix g <type> <name>` — Generate component/page/api/...
 */
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import prompts from 'prompts';
import { log, writeFile, capitalize, pascalCase, camelCase } from './shared.js';

export async function generateCommand(type?: string, name?: string) {
  const validTypes = ['page', 'layout', 'component', 'hook', 'api', 'action', 'middleware', 'context', 'loading', 'error', 'not-found'];

  if (!type) {
    const { type: selectedType } = await prompts({
      type: 'select',
      name: 'type',
      message: 'What do you want to generate?',
      choices: validTypes.map(t => ({ title: t, value: t })),
    });
    type = selectedType;
    if (!type) process.exit(0);
  }

  if (!validTypes.includes(type)) {
    log.error(`Invalid type: ${type}. Valid: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  if (!name && !['loading', 'error', 'not-found'].includes(type)) {
    const { name: inputName } = await prompts({
      type: 'text',
      name: 'name',
      message: `${type} name:`,
    });
    name = inputName;
    if (!name) process.exit(0);
  }

  const templates: Record<string, (n: string) => { path: string; content: string }> = {
    page: (n) => ({
      path: `app/${n}/page.tsx`,
      content: `export const metadata = {\n  title: "${capitalize(n)}",\n};\n\nexport default function ${pascalCase(n)}Page() {\n  return (\n    <main>\n      <h1>${capitalize(n)}</h1>\n    </main>\n  );\n}\n`
    }),
    layout: (n) => ({
      path: `app/${n}/layout.tsx`,
      content: `export default function ${pascalCase(n)}Layout({ children }: { children: React.ReactNode }) {\n  return <div>{children}</div>;\n}\n`
    }),
    component: (n) => ({
      path: `components/${pascalCase(n)}.tsx`,
      content: `interface ${pascalCase(n)}Props {\n  // props\n}\n\nexport default function ${pascalCase(n)}({}: ${pascalCase(n)}Props) {\n  return <div>${pascalCase(n)}</div>;\n}\n`
    }),
    hook: (n) => ({
      path: `hooks/use${pascalCase(n)}.ts`,
      content: `import { useState } from 'react';\n\nexport function use${pascalCase(n)}() {\n  const [state, setState] = useState(null);\n  return { state, setState };\n}\n`
    }),
    api: (n) => ({
      path: `server/api/${n}.ts`,
      content: `export function GET(_request: Request) {\n  return Response.json({ message: "Hello from ${n}" });\n}\n\nexport function POST(_request: Request) {\n  return Response.json({ received: true });\n}\n`
    }),
    action: (n) => ({
      path: `server/actions/${n}.ts`,
      content: `'use server';\n\nexport async function ${camelCase(n)}Action(_prevState: unknown, formData: FormData) {\n  // Server action logic\n  return { success: true };\n}\n`
    }),
    middleware: (n) => ({
      path: `middleware/${n}.ts`,
      content: `export default async function ${camelCase(n)}Middleware(req: Request, res: Response, next: () => Promise<void>) {\n  // Middleware logic\n  await next();\n}\n`
    }),
    context: (n) => ({
      path: `contexts/${pascalCase(n)}Context.tsx`,
      content: `'use client';\nimport { createContext, useContext, type ReactNode } from 'react';\n\ninterface ${pascalCase(n)}ContextType {\n  // context values\n}\n\nconst ${pascalCase(n)}Context = createContext<${pascalCase(n)}ContextType | null>(null);\n\nexport function ${pascalCase(n)}Provider({ children }: { children: ReactNode }) {\n  return <${pascalCase(n)}Context.Provider value={{}}>{children}</${pascalCase(n)}Context.Provider>;\n}\n\nexport function use${pascalCase(n)}() {\n  const ctx = useContext(${pascalCase(n)}Context);\n  if (!ctx) throw new Error('use${pascalCase(n)} must be used within ${pascalCase(n)}Provider');\n  return ctx;\n}\n`
    }),
    loading: () => ({
      path: `app/loading.tsx`,
      content: `export default function Loading() {\n  return <div>Loading...</div>;\n}\n`
    }),
    error: () => ({
      path: `app/error.tsx`,
      content: `'use client';\n\nexport default function Error({ error, reset }: { error: Error; reset: () => void }) {\n  return (\n    <div>\n      <h2>Something went wrong!</h2>\n      <p>{error.message}</p>\n      <button onClick={reset}>Try again</button>\n    </div>\n  );\n}\n`
    }),
    'not-found': () => ({
      path: `app/not-found.tsx`,
      content: `export default function NotFound() {\n  return (\n    <div>\n      <h1>404 - Not Found</h1>\n      <p>The page you're looking for doesn't exist.</p>\n    </div>\n  );\n}\n`
    }),
  };

  const generator = templates[type!];
  if (!generator) { log.error(`No template for type: ${type}`); process.exit(1); }

  const { path: filePath, content } = generator(name || '');
  const fullPath = path.resolve(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    log.warn(`File already exists: ${filePath}`);
    const { overwrite } = await prompts({
      type: 'confirm', name: 'overwrite', message: 'Overwrite?', initial: false,
    });
    if (!overwrite) process.exit(0);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  log.success(`Created ${pc.cyan(filePath)}`);
}
