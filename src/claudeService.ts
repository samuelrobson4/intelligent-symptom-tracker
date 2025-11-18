/**
 * Claude API service for extracting symptom metadata from natural language
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExtractionResponse } from './types';
import { BASE_EXTRACTION_PROMPT, RETRY_PROMPT } from './promptTemplates';
import { parseAndValidate, generateErrorFeedback } from './validators';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('VITE_ANTHROPIC_API_KEY is not set in .env.local');
}

const client = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

/**
 * Extract symptom metadata from user input using Claude
 */
export async function extractMetadata(
  userMessage: string
): Promise<ExtractionResponse> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${BASE_EXTRACTION_PROMPT}\n\nUser message: "${userMessage}"`,
        },
      ],
    });

    // Extract the text from Claude's response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const textResponse = content.text.trim();

    // Remove markdown code blocks if present
    let jsonText = textResponse;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    // Parse the JSON response
    const extractedData: ExtractionResponse = JSON.parse(jsonText);

    return extractedData;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw error;
  }
}

/**
 * Process a message with automatic retry logic for validation errors
 * Attempts up to 3 times to get a valid response
 */
export async function processMessageWithRetry(
  userMessage: string,
  maxRetries: number = 3
): Promise<ExtractionResponse> {
  let lastError: string = '';
  let conversationContext: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content: `${BASE_EXTRACTION_PROMPT}\n\nUser message: "${userMessage}"`,
    },
  ];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: conversationContext,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      let jsonText = content.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      // Parse the JSON response
      const extractedData: ExtractionResponse = JSON.parse(jsonText);

      // Validate the metadata
      const validationResult = parseAndValidate(extractedData);

      if (validationResult.success) {
        // Update with validated data
        extractedData.metadata = validationResult.data!;
        return extractedData;
      }

      // Validation failed, prepare for retry
      lastError = validationResult.message || validationResult.error || 'Validation failed';
      const errorFeedback = generateErrorFeedback(validationResult);

      console.warn(`Attempt ${attempt + 1} failed validation:`, lastError);

      // Add the failed response and error feedback to context
      conversationContext.push(
        { role: 'assistant', content: jsonText },
        { role: 'user', content: RETRY_PROMPT(errorFeedback) }
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Attempt ${attempt + 1} failed:`, lastError);

      // For JSON parse errors or API errors, add retry prompt
      if (attempt < maxRetries - 1) {
        conversationContext.push({
          role: 'user',
          content: RETRY_PROMPT(lastError),
        });
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to get valid response after ${maxRetries} attempts. Last error: ${lastError}. Please rephrase your symptom description.`
  );
}

/**
 * Ask a follow-up question to gather more information
 */
export async function askFollowUp(
  conversationHistory: string[],
  followUpQuestion: string,
  userResponse: string
): Promise<ExtractionResponse> {
  try {
    const contextMessages = conversationHistory.join('\n');
    const prompt = `${BASE_EXTRACTION_PROMPT}\n\nPrevious conversation:\n${contextMessages}\n\nFollow-up question: "${followUpQuestion}"\nUser response: "${userResponse}"`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const extractedData: ExtractionResponse = JSON.parse(jsonText);
    return extractedData;
  } catch (error) {
    console.error('Error in follow-up:', error);
    throw error;
  }
}

/**
 * Collect a single OPQRST response from the user
 * Returns the user's answer as a string
 */
export async function collectOPQRSTResponse(
  question: string,
  userResponse: string
): Promise<string> {
  try {
    // For OPQRST questions, we just need to extract the user's answer
    // We could add validation or processing here if needed
    // For now, we'll return the response directly
    return userResponse.trim();
  } catch (error) {
    console.error('Error collecting OPQRST response:', error);
    throw error;
  }
}
