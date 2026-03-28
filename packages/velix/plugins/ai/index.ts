/**
 * Velix AI Plugin v1
 * @module velix-plugin-ai
 */

import { createAIClient } from './client';
import type { AIPluginConfig, AIClient } from './types';

// Export types
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
export default function aiPlugin(config: AIPluginConfig) {
  return {
    name: 'velix-ai',
    
    setup(ctx: any) {
      // Create AI client
      const client = createAIClient(config);
      
      // Attach to context
      ctx.ai = client;
      
      // Make available globally for server actions
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__VELIX_AI__ = client;
      }
    }
  };
}

/**
 * Get AI client in server actions
 */
export function useAI(): AIClient {
  if (typeof globalThis === 'undefined' || !(globalThis as any).__VELIX_AI__) {
    throw new Error('AI client not initialized. Make sure aiPlugin is configured.');
  }
  
  return (globalThis as any).__VELIX_AI__;
}

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
export function createAIAction<TInput = any, TOutput = string>(config: {
  input: TInput;
  prompt: (input: TInput) => string;
  system?: string;
  model?: string;
  temperature?: number;
  transform?: (response: string) => TOutput;
}) {
  return async (input: TInput): Promise<TOutput> => {
    const ai = useAI();
    
    const prompt = config.prompt(input);
    
    const response = await ai.generate({
      prompt,
      system: config.system,
      model: config.model,
      temperature: config.temperature
    });
    
    if (config.transform) {
      return config.transform(response.text);
    }
    
    return response.text as TOutput;
  };
}
