/**
 * Claude API service for extracting symptom metadata from natural language
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExtractionResponse, AdditionalInsights } from './types';
import { EnrichedIssue } from './localStorage';
import { getConversationalPrompt, RETRY_PROMPT } from './promptTemplates';
import { parseAndValidate, generateErrorFeedback } from './validators';
import { createTrace, logGeneration, logEvent, updateTrace, isLangfuseEnabled } from './langfuse';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('VITE_ANTHROPIC_API_KEY is not set in .env.local');
}

const client = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

/**
 * Process a conversational message and extract/update symptom metadata
 * This function maintains conversation context and gradually builds up the symptom data
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationResult {
  extractedData: ExtractionResponse;
  additionalInsights: AdditionalInsights;
}

export async function processChatMessage(
  conversationHistory: ConversationMessage[],
  userMessage: string,
  activeIssues: EnrichedIssue[] = [],
  maxRetries: number = 3
): Promise<ConversationResult> {
  let lastError: string = '';

  // Create Langfuse trace for this conversation turn
  const trace = isLangfuseEnabled()
    ? createTrace({
        sessionId: `session-${Date.now()}`,
        metadata: {
          conversationTurn: conversationHistory.length + 1,
          activeIssuesCount: activeIssues.length,
          userMessage,
        },
      })
    : null;

  // Build the conversation context for Claude
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add the system prompt as the first user message (with issue context)
  messages.push({
    role: 'user',
    content: getConversationalPrompt(activeIssues),
  });

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the new user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const startTime = Date.now();

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: messages,
      });

      const latencyMs = Date.now() - startTime;
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      let jsonText = content.text.trim();

      // Log Claude API call to Langfuse
      if (trace) {
        logGeneration({
          trace,
          name: `symptom-extraction-attempt-${attempt + 1}`,
          model: response.model,
          input: messages,
          output: jsonText,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          latencyMs,
          promptName: 'conversational-extraction',
          promptVersion: 'v1',
          metadata: {
            attempt: attempt + 1,
            maxRetries,
          },
        });
      }

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      // Parse the JSON response
      const parsed = JSON.parse(jsonText);

      // Validate the metadata (allowing null values during conversation)
      const validationResult = parseAndValidate(parsed);

      if (validationResult.success || attempt === maxRetries - 1) {
        // Extract the data
        const extractedData: ExtractionResponse = {
          metadata: parsed.metadata,
          aiMessage: parsed.aiMessage,
          conversationComplete: parsed.conversationComplete || false,
          suggestedIssue: parsed.suggestedIssue, // AI's suggestion for issue relationship
          queuedSymptoms: parsed.queuedSymptoms || [], // Additional symptoms to log
          issueSelection: parsed.issueSelection || null, // User's issue selection from conversation
        };

        const additionalInsights: AdditionalInsights = parsed.additionalInsights || {};

        // Update trace with final result
        if (trace) {
          updateTrace({
            trace,
            output: {
              extractedData,
              additionalInsights,
            },
            metadata: {
              validationSuccess: validationResult.success,
              totalAttempts: attempt + 1,
              conversationComplete: extractedData.conversationComplete,
            },
            tags: [
              validationResult.success ? 'success' : 'max-retries-reached',
              extractedData.conversationComplete ? 'complete' : 'in-progress',
            ],
          });
        }

        return {
          extractedData,
          additionalInsights,
        };
      }

      // Validation failed, prepare for retry
      lastError = validationResult.message || validationResult.error || 'Validation failed';
      const errorFeedback = generateErrorFeedback(validationResult);

      console.warn(`Attempt ${attempt + 1} failed validation:`, lastError);

      // Log validation failure to Langfuse
      if (trace) {
        logEvent({
          trace,
          name: 'validation-failed',
          level: 'WARNING',
          metadata: {
            attempt: attempt + 1,
            error: lastError,
            validationResult,
          },
        });
      }

      // Add the failed response and error feedback to context
      messages.push(
        { role: 'assistant', content: jsonText },
        { role: 'user', content: RETRY_PROMPT(errorFeedback) }
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Attempt ${attempt + 1} failed:`, lastError);

      // Log API error to Langfuse
      if (trace) {
        logEvent({
          trace,
          name: 'api-error',
          level: 'ERROR',
          metadata: {
            attempt: attempt + 1,
            error: lastError,
            errorType: error instanceof Error ? error.constructor.name : 'unknown',
          },
        });
      }

      // For JSON parse errors or API errors, add retry prompt
      if (attempt < maxRetries - 1) {
        messages.push({
          role: 'user',
          content: RETRY_PROMPT(lastError),
        });
      }
    }
  }

  // All retries failed - log final error and throw
  if (trace) {
    logEvent({
      trace,
      name: 'all-retries-failed',
      level: 'ERROR',
      metadata: {
        totalAttempts: maxRetries,
        finalError: lastError,
      },
    });

    updateTrace({
      trace,
      metadata: {
        failed: true,
        error: lastError,
      },
      tags: ['failed', 'max-retries-exhausted'],
    });
  }

  throw new Error(
    `Failed to get valid response after ${maxRetries} attempts. Last error: ${lastError}`
  );
}
