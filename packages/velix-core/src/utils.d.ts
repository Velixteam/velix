/**
 * Velix v5 Utility Functions
 */
/**
 * Generates a unique hash for cache busting
 */
export declare function generateHash(content: string): string;
/**
 * Escapes HTML special characters
 */
export declare function escapeHtml(str: string): string;
/**
 * Recursively finds all files matching a pattern
 */
export declare function findFiles(dir: string, pattern: RegExp, files?: string[]): string[];
/**
 * Ensures a directory exists
 */
export declare function ensureDir(dir: string): void;
/**
 * Cleans a directory
 */
export declare function cleanDir(dir: string): void;
/**
 * Copies a directory recursively
 */
export declare function copyDir(src: string, dest: string): void;
/**
 * Debounce function for file watching
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Formats bytes to human-readable string
 */
export declare function formatBytes(bytes: number): string;
/**
 * Formats milliseconds to human-readable string
 */
export declare function formatTime(ms: number): string;
/**
 * Creates a deferred promise
 */
export declare function createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};
/**
 * Sleep utility
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Check if a file is a server component (has 'use server' directive)
 */
export declare function isServerComponent(filePath: string): boolean;
/**
 * Check if a file is a client component (has 'use client' directive)
 */
export declare function isClientComponent(filePath: string): boolean;
/**
 * Check if a component is an island (has 'use island' directive)
 */
export declare function isIsland(filePath: string): boolean;
//# sourceMappingURL=utils.d.ts.map