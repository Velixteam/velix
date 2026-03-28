/**
 * Example: Data Extraction with AI
 */

import { createAIAction } from '../index';
import { safeJsonParse } from '../utils';

/**
 * Extract structured data from text
 */
export const extractContactInfo = createAIAction({
  input: { text: 'string' },
  prompt: ({ text }) => `
Extract contact information from this text:

${text}

Return JSON:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "company": "company name",
  "role": "job title"
}

If a field is not found, use null.
  `.trim(),
  system: 'You are a data extraction expert.',
  temperature: 0.1,
  transform: (response) => safeJsonParse(response)
});

/**
 * Extract entities from text
 */
export const extractEntities = createAIAction({
  input: { text: 'string' },
  prompt: ({ text }) => `
Extract named entities from this text:

${text}

Return JSON:
{
  "people": ["person1", "person2"],
  "organizations": ["org1", "org2"],
  "locations": ["location1", "location2"],
  "dates": ["date1", "date2"],
  "technologies": ["tech1", "tech2"]
}
  `.trim(),
  system: 'You are an NLP expert.',
  temperature: 0.1,
  transform: (response) => safeJsonParse(response)
});

/**
 * Classify text sentiment
 */
export const analyzeSentiment = createAIAction({
  input: { text: 'string' },
  prompt: ({ text }) => `
Analyze the sentiment of this text:

${text}

Return JSON:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0.0 to 1.0,
  "emotions": ["emotion1", "emotion2"],
  "summary": "brief explanation"
}
  `.trim(),
  system: 'You are a sentiment analysis expert.',
  temperature: 0.2,
  transform: (response) => safeJsonParse(response)
});

/**
 * Parse invoice data
 */
export const parseInvoice = createAIAction({
  input: { invoiceText: 'string' },
  prompt: ({ invoiceText }) => `
Extract invoice data from this text:

${invoiceText}

Return JSON:
{
  "invoiceNumber": "string",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "vendor": {
    "name": "string",
    "address": "string"
  },
  "customer": {
    "name": "string",
    "address": "string"
  },
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number
}
  `.trim(),
  system: 'You are an invoice processing expert.',
  temperature: 0.1,
  transform: (response) => safeJsonParse(response)
});
