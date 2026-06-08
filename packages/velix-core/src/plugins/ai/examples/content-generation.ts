/**
 * Example: Content Generation with AI
 */

import { createAIAction, useAI } from '../index';
import { safeJsonParse } from '../utils';

/**
 * Generate blog post
 */
export const generateBlogPost = createAIAction({
  input: { topic: 'string', tone: 'string' },
  prompt: ({ topic, tone }) => `
Write a comprehensive blog post about: ${topic}

Tone: ${tone}

Include:
- Engaging title
- Introduction
- 3-4 main sections
- Conclusion
- SEO-friendly content

Format as markdown.
  `.trim(),
  system: 'You are a professional content writer.',
  temperature: 0.8
});

/**
 * Generate social media posts
 */
export const generateSocialPosts = async (input: { topic: string; platforms: string[] }) => {
  const ai = useAI();
  
  const response = await ai.generate({
    prompt: `
Create social media posts about: ${input.topic}

Platforms: ${input.platforms.join(', ')}

Return JSON with this structure:
{
  "twitter": "280 char tweet",
  "linkedin": "professional post",
  "instagram": "caption with hashtags"
}
    `.trim(),
    system: 'You are a social media expert.',
    temperature: 0.7
  });
  
  return safeJsonParse(response.text);
};

/**
 * Summarize text
 */
export const summarize = createAIAction({
  input: { text: 'string', maxWords: 'number' },
  prompt: ({ text, maxWords }) => `
Summarize the following text in ${maxWords} words or less:

${text}

Keep the summary concise and capture the main points.
  `.trim(),
  system: 'You are a summarization expert.',
  temperature: 0.3
});

/**
 * Generate SEO metadata
 */
export const generateSEO = async (input: { content: string; keywords: string[] }) => {
  const ai = useAI();
  
  const response = await ai.generate({
    prompt: `
Generate SEO metadata for this content:

${input.content}

Target keywords: ${input.keywords.join(', ')}

Return JSON:
{
  "title": "SEO title (60 chars)",
  "description": "Meta description (160 chars)",
  "keywords": ["keyword1", "keyword2"],
  "ogTitle": "Open Graph title",
  "ogDescription": "OG description"
}
    `.trim(),
    system: 'You are an SEO expert.',
    temperature: 0.4
  });
  
  return safeJsonParse(response.text);
};

/**
 * Streaming story generator
 */
export async function* generateStory(prompt: string, genre: string) {
  const ai = useAI();
  
  const stream = ai.stream({
    prompt: `Write a ${genre} story about: ${prompt}`,
    system: 'You are a creative storyteller.',
    temperature: 0.9,
    maxTokens: 1000
  });
  
  for await (const chunk of stream) {
    if (!chunk.done) {
      yield chunk.text;
    }
  }
}
