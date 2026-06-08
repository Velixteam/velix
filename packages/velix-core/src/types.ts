/**
 * Velix v5 Core Types
 * Comprehensive type definitions for the framework
 */

import type { IncomingMessage, ServerResponse } from 'http';
// Core types must be framework-agnostic. In the React adapter, these map to ReactNode and ComponentType.
type ReactNode = unknown;
type ComponentType<P = {}> = unknown;

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
  tree: RouteTreeNode;
  appRoutes: Route[];
  rootLayout?: string;
}

export interface RouteTreeNode {
  children: Record<string, RouteTreeNode>;
  routes: Route[];
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

export type InferParams<Path extends string> =
  Path extends `${infer _Start}/[...${infer Param}]/${infer Rest}`
    ? { [K in Param]: string } & InferParams<`/${Rest}`>
    : Path extends `${infer _Start}/[[...${infer Param}]]/${infer Rest}`
      ? { [K in Param]?: string } & InferParams<`/${Rest}`>
      : Path extends `${infer _Start}/[${infer Param}]/${infer Rest}`
        ? { [K in Param]: string } & InferParams<`/${Rest}`>
        : Path extends `${infer _Start}/[...${infer Param}]`
          ? { [K in Param]: string }
          : Path extends `${infer _Start}/[[...${infer Param}]]`
            ? { [K in Param]?: string }
            : Path extends `${infer _Start}/[${infer Param}]`
              ? { [K in Param]: string }
              : Record<string, string>;

export interface PageProps<TPath extends string = string> {
  params: InferParams<TPath>;
  searchParams?: Record<string, string>;
}

export interface LayoutProps<TPath extends string = string> {
  children: ReactNode;
  params: InferParams<TPath>;
}

export interface ErrorProps {
  error: Error;
  reset: () => void;
}

export interface LoadingProps {}

export interface NotFoundProps {}

export type PageComponent<TPath extends string = string> = ComponentType<PageProps<TPath>>;
export type LayoutComponent<TPath extends string = string> = ComponentType<LayoutProps<TPath>>;
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
  setup?: (config: import('./config.js').VelixConfig) => void | Promise<void>;
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
