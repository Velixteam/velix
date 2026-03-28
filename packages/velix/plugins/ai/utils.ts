/**
 * Velix AI Plugin - Utilities
 * @module velix-plugin-ai/utils
 */

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; retryDelay: number } = { maxRetries: 3, retryDelay: 1000 }
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < options.maxRetries - 1) {
        const delay = options.retryDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Safe JSON parsing with fallback
 */
export function safeJsonParse<T = any>(text: string, fallback?: T): T | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to parse the whole text
    return JSON.parse(text);
  } catch {
    return fallback ?? null;
  }
}

/**
 * Build a prompt from a template
 */
export function buildPrompt(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key]?.toString() ?? '';
  });
}

/**
 * Validate API key
 */
export function validateApiKey(apiKey: string | undefined, provider: string): void {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`API key is required for ${provider} provider`);
  }
}

/**
 * Validate input
 */
export function validateInput(input: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!(field in input) || input[field] === undefined || input[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Create a streaming text decoder
 */
export function createStreamDecoder() {
  const decoder = new TextDecoder();
  
  return (chunk: Uint8Array): string => {
    return decoder.decode(chunk, { stream: true });
  };
}

/**
 * Parse SSE (Server-Sent Events) data
 */
export function parseSSE(line: string): any {
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  const data = line.slice(6);
  
  if (data === '[DONE]') {
    return { done: true };
  }
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Sanitize input text
 */
export function sanitizeInput(text: string): string {
  return text.trim().replace(/\0/g, '');
}

/**
 * Count tokens (rough estimation)
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to max tokens
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars) + '...';
}
