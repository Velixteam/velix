/**
 * Velix AI Plugin - AI Client
 * @module velix-plugin-ai/client
 */

import type {
  AIClient,
  AIProvider,
  AIInput,
  AIResponse,
  ChatInput,
  AIStreamChunk,
  EmbedInput,
  EmbedResponse,
  AIPluginConfig
} from './types';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

/**
 * Create an AI client
 */
export function createAIClient(config: AIPluginConfig): AIClient {
  const provider = createProvider(config);

  return {
    async generate(input: AIInput): Promise<AIResponse> {
      return provider.generate(input);
    },

    async chat(input: ChatInput): Promise<AIResponse> {
      return provider.chat(input);
    },

    stream(input: AIInput): AsyncIterable<AIStreamChunk> {
      return provider.stream(input);
    },

    async embed(input: EmbedInput): Promise<EmbedResponse> {
      return provider.embed(input);
    },

    getProvider(): AIProvider {
      return provider;
    }
  };
}

/**
 * Create a provider instance
 */
function createProvider(config: AIPluginConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider({
        apiKey: config.apiKey!,
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        retry: config.retry
      });

    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        retry: config.retry
      });

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
