/**
 * Velix v5 Configuration System
 * Handles loading, validation, and merging of velix.config.ts
 */
import { z } from 'zod';
export declare const VelixConfigSchema: z.ZodObject<{
    app: z.ZodDefault<z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        url?: string | undefined;
    }, {
        name?: string | undefined;
        url?: string | undefined;
    }>>;
    devtools: z.ZodDefault<z.ZodBoolean>;
    server: z.ZodDefault<z.ZodObject<{
        port: z.ZodDefault<z.ZodNumber>;
        host: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        port: number;
        host: string;
    }, {
        port?: number | undefined;
        host?: string | undefined;
    }>>;
    routing: z.ZodDefault<z.ZodObject<{
        trailingSlash: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        trailingSlash: boolean;
    }, {
        trailingSlash?: boolean | undefined;
    }>>;
    seo: z.ZodDefault<z.ZodObject<{
        sitemap: z.ZodDefault<z.ZodBoolean>;
        robots: z.ZodDefault<z.ZodBoolean>;
        openGraph: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        sitemap: boolean;
        robots: boolean;
        openGraph: boolean;
    }, {
        sitemap?: boolean | undefined;
        robots?: boolean | undefined;
        openGraph?: boolean | undefined;
    }>>;
    build: z.ZodDefault<z.ZodObject<{
        target: z.ZodDefault<z.ZodString>;
        minify: z.ZodDefault<z.ZodBoolean>;
        sourcemap: z.ZodDefault<z.ZodBoolean>;
        splitting: z.ZodDefault<z.ZodBoolean>;
        outDir: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        target: string;
        minify: boolean;
        sourcemap: boolean;
        splitting: boolean;
        outDir: string;
    }, {
        target?: string | undefined;
        minify?: boolean | undefined;
        sourcemap?: boolean | undefined;
        splitting?: boolean | undefined;
        outDir?: string | undefined;
    }>>;
    experimental: z.ZodDefault<z.ZodObject<{
        islands: z.ZodDefault<z.ZodBoolean>;
        streaming: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        islands: boolean;
        streaming: boolean;
    }, {
        islands?: boolean | undefined;
        streaming?: boolean | undefined;
    }>>;
    plugins: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>]>, "many">>;
    appDir: z.ZodDefault<z.ZodString>;
    publicDir: z.ZodDefault<z.ZodString>;
    styles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    favicon: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    app: {
        name: string;
        url?: string | undefined;
    };
    devtools: boolean;
    server: {
        port: number;
        host: string;
    };
    routing: {
        trailingSlash: boolean;
    };
    seo: {
        sitemap: boolean;
        robots: boolean;
        openGraph: boolean;
    };
    build: {
        target: string;
        minify: boolean;
        sourcemap: boolean;
        splitting: boolean;
        outDir: string;
    };
    experimental: {
        islands: boolean;
        streaming: boolean;
    };
    plugins: (string | z.objectOutputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">)[];
    appDir: string;
    publicDir: string;
    styles: string[];
    favicon: string | null;
}, {
    app?: {
        name?: string | undefined;
        url?: string | undefined;
    } | undefined;
    devtools?: boolean | undefined;
    server?: {
        port?: number | undefined;
        host?: string | undefined;
    } | undefined;
    routing?: {
        trailingSlash?: boolean | undefined;
    } | undefined;
    seo?: {
        sitemap?: boolean | undefined;
        robots?: boolean | undefined;
        openGraph?: boolean | undefined;
    } | undefined;
    build?: {
        target?: string | undefined;
        minify?: boolean | undefined;
        sourcemap?: boolean | undefined;
        splitting?: boolean | undefined;
        outDir?: string | undefined;
    } | undefined;
    experimental?: {
        islands?: boolean | undefined;
        streaming?: boolean | undefined;
    } | undefined;
    plugins?: (string | z.objectInputType<{
        name: z.ZodString;
    }, z.ZodTypeAny, "passthrough">)[] | undefined;
    appDir?: string | undefined;
    publicDir?: string | undefined;
    styles?: string[] | undefined;
    favicon?: string | null | undefined;
}>;
export type VelixConfig = z.infer<typeof VelixConfigSchema>;
export declare const defaultConfig: VelixConfig;
/**
 * Helper function to define configuration with full type support.
 * Use this in your velix.config.ts file.
 *
 * @example
 * ```ts
 * import { defineConfig } from "velix";
 *
 * export default defineConfig({
 *   app: { name: "My App" },
 *   server: { port: 3000 },
 *   seo: { sitemap: true }
 * });
 * ```
 */
export declare function defineConfig(config: Partial<VelixConfig>): Partial<VelixConfig>;
/**
 * Loads and validates configuration from velix.config.ts
 */
export declare function loadConfig(projectRoot: string): Promise<VelixConfig>;
/**
 * Resolves all paths in config relative to project root
 */
export declare function resolvePaths(config: VelixConfig, projectRoot: string): VelixConfig & {
    resolvedAppDir: string;
    resolvedPublicDir: string;
    resolvedOutDir: string;
};
//# sourceMappingURL=config.d.ts.map