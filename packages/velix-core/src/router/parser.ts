/**
 * Creates regex pattern for route matching
 */
export function createRoutePattern(routePath: string): RegExp {
  let pattern = routePath
    .replace(/\*[^/]*/g, '(.*)')       // Catch-all
    .replace(/:[^/]+/g, '([^/]+)')     // Dynamic segments
    .replace(/\//g, '\\/');

  return new RegExp(`^${pattern}$`);
}

/**
 * Extracts parameters from route match
 */
export function extractParams(routePath: string, match: RegExpMatchArray): Record<string, string> {
  const params: Record<string, string> = {};
  const paramNames: string[] = [];

  const paramRegex = /:([^/]+)|\*([^/]*)/g;
  let paramMatch;
  while ((paramMatch = paramRegex.exec(routePath)) !== null) {
    paramNames.push(paramMatch[1] || paramMatch[2] || 'splat');
  }

  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return params;
}
