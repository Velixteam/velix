/**
 * Example: AI Chatbot with Velix
 */

import { useAI } from '../index';
import type { ChatMessage } from '../types';

/**
 * Simple chatbot server action
 */
export async function chatbot(messages: ChatMessage[]) {
  const ai = useAI();
  
  const response = await ai.chat({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant built with Velix framework.'
      },
      ...messages
    ],
    temperature: 0.7,
    maxTokens: 500
  });
  
  return {
    message: response.text,
    usage: response.usage
  };
}

/**
 * Streaming chatbot
 */
export async function* streamingChatbot(messages: ChatMessage[]) {
  const ai = useAI();
  
  // Convert chat to single prompt for streaming
  const prompt = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n') + '\nassistant:';
  
  const stream = ai.stream({
    prompt,
    system: 'You are a helpful AI assistant.',
    temperature: 0.7
  });
  
  for await (const chunk of stream) {
    if (!chunk.done) {
      yield chunk.text;
    }
  }
}
