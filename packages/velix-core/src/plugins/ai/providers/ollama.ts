/**
 * Velix AI Plugin - Ollama Provider
 * @module velix-plugin-ai/providers/ollama
 */

import type {
  AIProvider,
  AIInput,
  AIResponse,
  ChatInput,
  AIStreamChunk,
  EmbedInput,
  EmbedResponse
} from '../types';
import { retry } from '../utils';

export interface OllamaConfig {
  baseUrl?: string;
  defaultModel?: string;
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
}

export class OllamaProvider implements AIProvider {
  name = 'ollama' as const;
  private baseUrl: string;
  private defaultModel: string;
  private retryConfig: { maxRetries: number; retryDelay: number };

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'llama3.2';
    this.retryConfig = config.retry || { maxRetries: 3, retryDelay: 1000 };
  }

  async generate(input: AIInput): Promise<AIResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model || this.defaultModel,
          prompt: input.prompt,
          system: input.system,
          options: {
            temperature: input.temperature ?? 0.7,
            num_predict: input.maxTokens,
            stop: input.stop,
            ...input.options
          },
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.response,
        provider: 'ollama',
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        raw: data
      };
    }, this.retryConfig);
  }

  async chat(input: ChatInput): Promise<AIResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model || this.defaultModel,
          messages: input.messages,
          options: {
            temperature: input.temperature ?? 0.7,
            num_predict: input.maxTokens,
            stop: input.stop,
            ...input.options
          },
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.message.content,
        provider: 'ollama',
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        raw: data
      };
    }, this.retryConfig);
  }

  async *stream(input: AIInput): AsyncIterable<AIStreamChunk> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model || this.defaultModel,
        prompt: input.prompt,
        system: input.system,
        options: {
          temperature: input.temperature ?? 0.7,
          num_predict: input.maxTokens,
          stop: input.stop,
          ...input.options
        },
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            
            if (data.response) {
              yield {
                text: data.response,
                done: data.done || false,
                provider: 'ollama',
                model: data.model
              };
            }

            if (data.done) {
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      yield { text: '', done: true, provider: 'ollama' };
    } finally {
      reader.releaseLock();
    }
  }

  async embed(input: EmbedInput): Promise<EmbedResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model || this.defaultModel,
          prompt: input.text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.embedding,
        provider: 'ollama',
        model: data.model || input.model || this.defaultModel
      };
    }, this.retryConfig);
  }
}
