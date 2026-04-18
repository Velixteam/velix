/**
 * Velix v5 Core Types
 * Comprehensive type definitions for the framework
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { ReactNode, ComponentType } from 'react';

// ============================================================================
// Config Types
// ============================================================================

export interface VelixAppConfig {
  name?: string;
  url?: string;
}

export interface VelixServerConfig {
  port?: number;
  host?: string;
}

export interface VelixSEOConfig {
  sitemap?: boolean;
  robots?: boolean;
  openGraph?: boolean;
}

export interface VelixRoutingConfig {
  trailingSlash?: boolean;
}

export interface VelixExperimentalConfig {
  islands?: boolean;
  streaming?: boolean;
}

// ============================================================================
// Router Types
// ============================================================================

export type RouteType = 'page' | 'api' | 'layout' | 'loading' | 'error' | 'not-found';

export interface Route {
  type: RouteType;
  path: string;
  filePath: string;
  pattern: RegExp;
  segments: string[];
  layout?: string | null;
  loading?: string | null;
  error?: string | null;
  notFound?: string | null;
  template?: string | null;
  middleware?: string | null;
  isServerComponent?: boolean;
  isClientComponent?: boolean;
  isIsland?: boolean;
  params?: Record<string, string>;
}

export interface RouteTree {
  pages: Route[];
  api: Route[];
  layouts: Map<string, string>;
  tree: Record<string, unknown>;
  appRoutes: Route[];
  rootLayout?: string;
}

export interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

// ============================================================================
// Server Types
// ============================================================================

export type Request = IncomingMessage & {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  json?: () => Promise<unknown>;
};

export type Response = ServerResponse & {
  json?: (data: unknown) => void;
  send?: (data: string) => void;
  status?: (code: number) => Response;
};

export type NextFunction = () => void | Promise<void>;

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ApiHandler = (
  req: Request,
  res: Response
) => void | Promise<void>;

export type { MiddlewareRequest, MiddlewareResponse } from './middleware/index.js';

// ============================================================================
// React 19 Action Types
// ============================================================================

export type ActionState<T> = T | Promise<T>;

export interface ActionFormData {
  formData: FormData;
  reset: () => void;
}

export type ServerAction<State, Payload = FormData> = (
  prevState: Awaited<State>,
  payload: Payload
) => State | Promise<State>;

export interface TypedActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  redirect?: string;
}

// ============================================================================
// Component Types
// ============================================================================

export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export interface LayoutProps {
  children: ReactNode;
  params?: Record<string, string>;
}

export interface ErrorProps {
  error: Error;
  reset: () => void;
}

export interface LoadingProps {}

export interface NotFoundProps {}

export type PageComponent = ComponentType<PageProps>;
export type LayoutComponent = ComponentType<LayoutProps>;
export type ErrorComponent = ComponentType<ErrorProps>;
export type LoadingComponent = ComponentType<LoadingProps>;
export type NotFoundComponent = ComponentType<NotFoundProps>;

// ============================================================================
// Island Types
// ============================================================================

export interface IslandConfig {
  name: string;
  component: ComponentType<unknown>;
  props?: Record<string, unknown>;
  hydrate?: 'load' | 'idle' | 'visible' | 'media' | 'interaction';
  media?: string;
}

export interface IslandManifest {
  islands: Map<string, IslandConfig>;
}

// ============================================================================
// Build Types
// ============================================================================

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
  target?: string;
}

export interface BuildResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  duration?: number;
}

// ============================================================================
// SSG Types
// ============================================================================

export interface StaticPath {
  params: Record<string, string>;
}

export interface StaticProps {
  props: Record<string, unknown>;
  revalidate?: number | false;
  notFound?: boolean;
  redirect?: {
    destination: string;
    permanent?: boolean;
  };
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface VelixPlugin {
  name: string;
  setup?: (config: any) => void | Promise<void>;
  transform?: (code: string, id: string) => string | null | Promise<string | null>;
  buildStart?: () => void | Promise<void>;
  buildEnd?: () => void | Promise<void>;
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface Metadata {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export type { IncomingMessage, ServerResponse } from 'http';
export type { ReactNode, ComponentType } from 'react';
