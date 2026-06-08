/**
 * Example: AI Code Generator
 */

import { createAIAction } from '../index';

/**
 * Generate code from description
 */
export const generateCode = createAIAction({
  input: { description: 'string', language: 'string' },
  prompt: ({ description, language }) => `
Generate clean, production-ready ${language} code for the following:

${description}

Requirements:
- Follow best practices
- Add comments for complex logic
- Use modern syntax
- Include error handling

Only output the code, no explanations.
  `.trim(),
  system: 'You are an expert software engineer.',
  model: 'gpt-4o',
  temperature: 0.2
});

/**
 * Generate React component
 */
export const generateReactComponent = createAIAction({
  input: { name: 'string', description: 'string' },
  prompt: ({ name, description }) => `
Create a React component named "${name}" that ${description}.

Requirements:
- Use TypeScript
- Use functional component with hooks
- Add proper types
- Include JSDoc comments
- Use Tailwind CSS for styling

Only output the component code.
  `.trim(),
  system: 'You are a React expert.',
  temperature: 0.3
});

/**
 * Fix code bugs
 */
export const fixCode = createAIAction({
  input: { code: 'string', error: 'string' },
  prompt: ({ code, error }) => `
Fix this code that has the following error:

Error: ${error}

Code:
\`\`\`
${code}
\`\`\`

Provide the corrected code with a brief explanation of the fix.
  `.trim(),
  system: 'You are a debugging expert.',
  temperature: 0.1
});
