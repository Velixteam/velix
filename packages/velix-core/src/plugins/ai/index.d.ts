/**
 * Velix AI Plugin v1
 * @module velix-plugin-ai
 */
import type { AIPluginConfig, AIClient } from './types';
export * from './types';
export * from './utils';
export { OpenAIProvider } from './providers/openai';
export { OllamaProvider } from './providers/ollama';
export { createAIClient } from './client';
/**
 * Velix AI Plugin
 *
 * @example
 * ```ts
 * import aiPlugin from 'velix/plugins/ai';
 *
 * export default defineConfig({
 *   plugins: [
 *     aiPlugin({
 *       provider: 'openai',
 *       apiKey: process.env.OPENAI_API_KEY
 *     })
 *   ]
 * });
 * ```
 */
export default function aiPlugin(config: AIPluginConfig): {
    name: string;
    setup(ctx: Record<string, unknown>): void;
};
/**
 * Get AI client in server actions
 */
export declare function useAI(): AIClient;
/**
 * Create an AI-powered server action
 *
 * @example
 * ```ts
 * export const summarize = createAIAction({
 *   input: { text: 'string' },
 *   prompt: ({ text }) => `Summarize this text: ${text}`,
 *   system: 'You are a helpful assistant that summarizes text concisely.'
 * });
 * ```
 */
export declare function createAIAction<TInput = unknown, TOutput = string>(config: {
    input: TInput;
    prompt: (input: TInput) => string;
    system?: string;
    model?: string;
    temperature?: number;
    transform?: (response: string) => TOutput;
}): (input: TInput) => Promise<TOutput>;
//# sourceMappingURL=index.d.ts.map