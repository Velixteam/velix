/**
 * Velix AI Plugin - Ollama Provider
 * @module velix-plugin-ai/providers/ollama
 */
import type { AIProvider, AIInput, AIResponse, ChatInput, AIStreamChunk, EmbedInput, EmbedResponse } from '../types';
export interface OllamaConfig {
    baseUrl?: string;
    defaultModel?: string;
    retry?: {
        maxRetries: number;
        retryDelay: number;
    };
}
export declare class OllamaProvider implements AIProvider {
    name: "ollama";
    private baseUrl;
    private defaultModel;
    private retryConfig;
    constructor(config?: OllamaConfig);
    generate(input: AIInput): Promise<AIResponse>;
    chat(input: ChatInput): Promise<AIResponse>;
    stream(input: AIInput): AsyncIterable<AIStreamChunk>;
    embed(input: EmbedInput): Promise<EmbedResponse>;
}
//# sourceMappingURL=ollama.d.ts.map