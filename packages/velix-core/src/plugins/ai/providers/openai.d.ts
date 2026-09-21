/**
 * Velix AI Plugin - OpenAI Provider
 * @module velix-plugin-ai/providers/openai
 */
import type { AIProvider, AIInput, AIResponse, ChatInput, AIStreamChunk, EmbedInput, EmbedResponse } from '../types';
export interface OpenAIConfig {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
    organization?: string;
    retry?: {
        maxRetries: number;
        retryDelay: number;
    };
}
export declare class OpenAIProvider implements AIProvider {
    name: "openai";
    private apiKey;
    private baseUrl;
    private defaultModel;
    private organization?;
    private retryConfig;
    constructor(config: OpenAIConfig);
    generate(input: AIInput): Promise<AIResponse>;
    chat(input: ChatInput): Promise<AIResponse>;
    stream(input: AIInput): AsyncIterable<AIStreamChunk>;
    embed(input: EmbedInput): Promise<EmbedResponse>;
    private getHeaders;
}
//# sourceMappingURL=openai.d.ts.map