/**
 * Velix AI Plugin - Utilities
 * @module velix-plugin-ai/utils
 */
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries: number;
    retryDelay: number;
}): Promise<T>;
/**
 * Safe JSON parsing with fallback
 */
export declare function safeJsonParse<T = unknown>(text: string, fallback?: T): T | null;
/**
 * Build a prompt from a template
 */
export declare function buildPrompt(template: string, variables: Record<string, unknown>): string;
/**
 * Validate API key
 */
export declare function validateApiKey(apiKey: string | undefined, provider: string): void;
/**
 * Validate input
 */
export declare function validateInput(input: Record<string, unknown>, requiredFields: string[]): void;
/**
 * Create a streaming text decoder
 */
export declare function createStreamDecoder(): (chunk: Uint8Array) => string;
/**
 * Parse SSE (Server-Sent Events) data
 */
export declare function parseSSE(line: string): unknown;
/**
 * Sanitize input text
 */
export declare function sanitizeInput(text: string): string;
/**
 * Count tokens (rough estimation)
 */
export declare function estimateTokens(text: string): number;
/**
 * Truncate text to max tokens
 */
export declare function truncateToTokens(text: string, maxTokens: number): string;
//# sourceMappingURL=utils.d.ts.map