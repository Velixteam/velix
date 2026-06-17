import { glob } from 'glob';
import path from 'path';
import { pathToFileURL } from 'url';
import type { HttpMethod } from './define-route.js';

export type ApiRoute = {
  pattern: string;           // ex: /api/users/:id
  filePath: string;          // chemin absolu vers le fichier
  params: string[];          // noms des paramètres dynamiques
  isCatchAll: boolean;
};

export async function buildApiManifest(serverDir: string): Promise<ApiRoute[]> {
  const files = await glob('api/**/*.ts', { cwd: serverDir, absolute: true });
  return files.map(file => filePathToRoute(file, serverDir));
}

/** Exported for testing */
export function filePathToRoute(filePath: string, serverDir: string): ApiRoute {
  const relative = path.relative(path.join(serverDir, 'api'), filePath);
  // Ensure we replace Windows backslashes with forward slashes for the pattern
  const normalizedRelative = relative.replace(/\\/g, '/');
  const withoutExt = normalizedRelative.replace(/\.ts$/, '');
  
  // users.[id] → /api/users/:id
  // auth/[...slug] → /api/auth/*
  const params: string[] = [];
  let isCatchAll = false;

  const pattern = '/api/' + withoutExt
    .replace(/\[\.\.\.(\w+)\]/g, (_, name) => { isCatchAll = true; params.push(name); return '*'; })
    .replace(/\[(\w+)\]/g, (_, name) => { params.push(name); return `:${name}`; })
    .replace(/\.\[/g, '/[')    // users.[id] → users/[id]
    .replace(/\./g, '/');       // nested avec dots → slashes

  return { pattern, filePath, params, isCatchAll };
}

function matchPattern(pathname: string, route: ApiRoute): { params: Record<string, string> } | null {
  if (route.isCatchAll) {
    const base = route.pattern.replace('/*', '');
    if (pathname.startsWith(base)) {
      const rest = pathname.slice(base.length);
      const params: Record<string, string> = {};
      if (route.params[0]) {
        params[route.params[0]] = rest.startsWith('/') ? rest.slice(1) : rest;
      }
      return { params };
    }
    return null;
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = route.pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i];
    } else if (part !== pathParts[i]) {
      return null;
    }
  }

  return { params };
}

export async function handleApiRequest(
  req: Request,
  manifest: ApiRoute[]
): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  for (const route of manifest) {
    const match = matchPattern(pathname, route);
    if (!match) continue;

    const fileUrl = pathToFileURL(route.filePath).href;
    const handlers = await import(`${fileUrl}?t=${Date.now()}`);
    const method = req.method.toUpperCase() as HttpMethod;
    const handler = handlers[method] || handlers.default;

    if (!handler) {
      return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    return handler(req, {
      params: match.params,
      searchParams: url.searchParams,
    });
  }

  return null; // pas de route API → fallback SSR
}
