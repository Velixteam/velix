/**
 * Velix AI Plugin - Type Definitions
 * @module velix-plugin-ai/types
 */

/**
 * Supported AI providers
 */
export type AIProviderType = 'openai' | 'ollama' | 'anthropic';

/**
 * AI input configuration
 */
export interface AIInput {
  /** The prompt or message to send to the AI */
  prompt: string;
  /** System message for context */
  system?: string;
  /** Model to use (provider-specific) */
  model?: string;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Stop sequences */
  stop?: string[];
  /** Additional provider-specific options */
  options?: Record<string, any>;
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat input configuration
 */
export interface ChatInput {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Model to use */
  model?: string;
  /** Temperature for randomness (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Stop sequences */
  stop?: string[];
  /** Additional provider-specific options */
  options?: Record<string, any>;
}

/**
 * AI response
 */
export interface AIResponse {
  /** Generated text */
  text: string;
  /** Provider that generated the response */
  provider: AIProviderType;
  /** Model used */
  model: string;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Raw provider response */
  raw?: any;
}

/**
 * Stream chunk
 */
export interface AIStreamChunk {
  /** Chunk of generated text */
  text: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Provider that generated the chunk */
  provider?: AIProviderType;
  /** Model used */
  model?: string;
}

/**
 * Embedding input
 */
export interface EmbedInput {
  /** Text to embed */
  text: string;
  /** Model to use for embeddings */
  model?: string;
}

/**
 * Embedding response
 */
export interface EmbedResponse {
  /** Embedding vector */
  embedding: number[];
  /** Provider that generated the embedding */
  provider: AIProviderType;
  /** Model used */
  model: string;
}

/**
 * AI Provider interface
 */
export interface AIProvider {
  /** Provider name */
  name: AIProviderType;
  
  /** Generate text from a prompt */
  generate(input: AIInput): Promise<AIResponse>;
  
  /** Chat with messages */
  chat(input: ChatInput): Promise<AIResponse>;
  
  /** Stream text generation */
  stream(input: AIInput): AsyncIterable<AIStreamChunk>;
  
  /** Generate embeddings */
  embed(input: EmbedInput): Promise<EmbedResponse>;
}

/**
 * AI Plugin configuration
 */
export interface AIPluginConfig {
  /** Provider to use */
  provider: AIProviderType;
  /** API key (for cloud providers) */
  apiKey?: string;
  /** Base URL (for custom endpoints) */
  baseUrl?: string;
  /** Default model */
  defaultModel?: string;
  /** Default temperature */
  defaultTemperature?: number;
  /** Retry configuration */
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
}

/**
 * AI Client interface
 */
export interface AIClient {
  /** Generate text from a prompt */
  generate(input: AIInput): Promise<AIResponse>;
  
  /** Chat with messages */
  chat(input: ChatInput): Promise<AIResponse>;
  
  /** Stream text generation */
  stream(input: AIInput): AsyncIterable<AIStreamChunk>;
  
  /** Generate embeddings */
  embed(input: EmbedInput): Promise<EmbedResponse>;
  
  /** Get current provider */
  getProvider(): AIProvider;
}

/**
 * Action AI configuration
 */
export interface ActionAIConfig<TInput = any> {
  /** Input schema */
  input: TInput;
  /** Prompt builder function */
  prompt: (input: TInput) => string;
  /** System message */
  system?: string;
  /** Model to use */
  model?: string;
  /** Temperature */
  temperature?: number;
  /** Post-processing function */
  transform?: (response: string) => any;
}
