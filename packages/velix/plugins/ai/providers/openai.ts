/**
 * Velix AI Plugin - OpenAI Provider
 * @module velix-plugin-ai/providers/openai
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
import { validateApiKey, retry, parseSSE } from '../utils';

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

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private organization?: string;
  private retryConfig: { maxRetries: number; retryDelay: number };

  constructor(config: OpenAIConfig) {
    validateApiKey(config.apiKey, 'OpenAI');
    
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel || 'gpt-4o-mini';
    this.organization = config.organization;
    this.retryConfig = config.retry || { maxRetries: 3, retryDelay: 1000 };
  }

  async generate(input: AIInput): Promise<AIResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: input.model || this.defaultModel,
          messages: [
            ...(input.system ? [{ role: 'system', content: input.system }] : []),
            { role: 'user', content: input.prompt }
          ],
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens,
          stop: input.stop,
          ...input.options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices[0].message.content,
        provider: 'openai',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        raw: data
      };
    }, this.retryConfig);
  }

  async chat(input: ChatInput): Promise<AIResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: input.model || this.defaultModel,
          messages: input.messages,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens,
          stop: input.stop,
          ...input.options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices[0].message.content,
        provider: 'openai',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        raw: data
      };
    }, this.retryConfig);
  }

  async *stream(input: AIInput): AsyncIterable<AIStreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: input.model || this.defaultModel,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          { role: 'user', content: input.prompt }
        ],
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens,
        stop: input.stop,
        stream: true,
        ...input.options
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
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
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          const parsed = parseSSE(trimmed);
          if (!parsed) continue;

          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield {
              text: delta,
              done: false,
              provider: 'openai',
              model: parsed.model
            };
          }
        }
      }

      yield { text: '', done: true, provider: 'openai' };
    } finally {
      reader.releaseLock();
    }
  }

  async embed(input: EmbedInput): Promise<EmbedResponse> {
    return retry(async () => {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: input.model || 'text-embedding-3-small',
          input: input.text
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.data[0].embedding,
        provider: 'openai',
        model: data.model
      };
    }, this.retryConfig);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    return headers;
  }
}
