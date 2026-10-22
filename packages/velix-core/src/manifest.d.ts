/**
 * Velix Manifest Definition & Loader
 * Strict Zod schema and loader for dist/manifest.json.
 */
import { z } from 'zod';
export declare const RouteManifestEntrySchema: z.ZodObject<{
    serverFile: z.ZodString;
    layouts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    clientChunks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    css: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    layouts: string[];
    serverFile: string;
    clientChunks: string[];
    css: string[];
}, {
    serverFile: string;
    layouts?: string[] | undefined;
    clientChunks?: string[] | undefined;
    css?: string[] | undefined;
}>;
export declare const AssetManifestEntrySchema: z.ZodObject<{
    size: z.ZodNumber;
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    size: number;
    hash: string;
}, {
    size: number;
    hash: string;
}>;
export declare const ManifestSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodNumber>;
    buildId: z.ZodString;
    version: z.ZodString;
    routes: z.ZodRecord<z.ZodString, z.ZodObject<{
        serverFile: z.ZodString;
        layouts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        clientChunks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        css: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        layouts: string[];
        serverFile: string;
        clientChunks: string[];
        css: string[];
    }, {
        serverFile: string;
        layouts?: string[] | undefined;
        clientChunks?: string[] | undefined;
        css?: string[] | undefined;
    }>>;
    islands: z.ZodRecord<z.ZodString, z.ZodString>;
    styles: z.ZodArray<z.ZodString, "many">;
    assets: z.ZodRecord<z.ZodString, z.ZodObject<{
        size: z.ZodNumber;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: number;
        hash: string;
    }, {
        size: number;
        hash: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    islands: Record<string, string>;
    styles: string[];
    version: string;
    schemaVersion: number;
    buildId: string;
    routes: Record<string, {
        layouts: string[];
        serverFile: string;
        clientChunks: string[];
        css: string[];
    }>;
    assets: Record<string, {
        size: number;
        hash: string;
    }>;
}, {
    islands: Record<string, string>;
    styles: string[];
    version: string;
    buildId: string;
    routes: Record<string, {
        serverFile: string;
        layouts?: string[] | undefined;
        clientChunks?: string[] | undefined;
        css?: string[] | undefined;
    }>;
    assets: Record<string, {
        size: number;
        hash: string;
    }>;
    schemaVersion?: number | undefined;
}>;
export type RouteManifestEntry = z.infer<typeof RouteManifestEntrySchema>;
export type AssetManifestEntry = z.infer<typeof AssetManifestEntrySchema>;
export type VelixManifest = z.infer<typeof ManifestSchema>;
/**
 * Validates untrusted data against ManifestSchema.
 * Throws a formatted ZodError if invalid.
 */
export declare function parseManifest(data: unknown): VelixManifest;
export interface LoadManifestOptions {
    outDir?: string;
    appDir?: string;
    config?: {
        styles?: string[];
        [key: string]: unknown;
    };
}
/**
 * Single deterministic loader for the asset manifest.
 *
 * In production:
 *   Reads `dist/manifest.json`, validates it with Zod, and verifies that every
 *   referenced file actually exists on disk. Refuses to start if anything is missing.
 *
 * In development:
 *   Constructs an in-memory manifest of the exact same schema from the source tree.
 */
export declare function loadAssetManifest(mode: 'development' | 'production', projectRoot: string, options?: LoadManifestOptions): Promise<VelixManifest>;
//# sourceMappingURL=manifest.d.ts.map