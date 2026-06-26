export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type RouteContext = {
  params: Record<string, string>;
  searchParams: URLSearchParams;
};

export type RouteHandler = (
  req: Request,
  ctx: RouteContext
) => Response | Promise<Response>;

import { VelixHttpError } from '../server/errors.js';
export { VelixHttpError };

export function defineRoute(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof VelixHttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error('[Velix API]', err);
      return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
