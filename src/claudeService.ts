/**
 * Claude API service for extracting symptom metadata from natural language
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExtractionResponse } from './types';
import { BASE_EXTRACTION_PROMPT } from './promptTemplates';

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
