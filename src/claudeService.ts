// Claude API service for extracting symptom metadata from natural language

import Anthropic from '@anthropic-ai/sdk';
import { ExtractionResponse, AdditionalInsights } from './types';
import { EnrichedIssue, getSymptoms } from './localStorage';
import { getConversationalPrompt, RETRY_PROMPT, TOOL_DEFINITIONS } from './promptTemplates';
import { parseAndValidate, generateErrorFeedback } from './validators';
import { createTrace, logGeneration, logEvent, updateTrace, isLangfuseEnabled } from './langfuse';
import { executeToolCall } from './toolHandlers';

// Use Anthropic SDK types for content blocks
type ToolUseBlock = Anthropic.ToolUseBlock;
type ToolResultBlockParam = Anthropic.ToolResultBlockParam;
type TextBlock = Anthropic.TextBlock;

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('VITE_ANTHROPIC_API_KEY is not set in .env.local');
}

const client = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
  timeout: 15000, // 15 second timeout to prevent indefinite hangs
});

// Helper function for exponential backoff delays
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process a conversational message and extract/update symptom metadata
// This function maintains conversation context and gradually builds up the symptom data
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationResult {
  extractedData: ExtractionResponse;
  additionalInsights: AdditionalInsights;
}

// Streaming callback type for progressive UI updates
export type StreamCallback = (chunk: string) => void;

export async function processChatMessage(
  conversationHistory: ConversationMessage[],
  userMessage: string,
  activeIssues: EnrichedIssue[] = [],
  maxRetries: number = 3,
  onStream?: StreamCallback,
  isMultiSymptomContinuation: boolean = false
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

  // Fetch recent 5 symptom entries for prompt context
  const allSymptoms = getSymptoms();
  const recentHistory = allSymptoms
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  // Generate system prompt with context
  const systemPrompt = getConversationalPrompt(activeIssues, recentHistory);

  // Build the conversation context for Claude
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history (no need to add system prompt as a message)
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // If this is a multi-symptom continuation, add format enforcement
  if (isMultiSymptomContinuation && conversationHistory.length > 0) {
    messages.push({
      role: 'user',
      content: `SYSTEM REMINDER: You must respond with valid JSON format as specified in your instructions, not plain conversational text. The user is confirming they want to log another symptom from the todo list.`
    });
  }

  // Add the new user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  // Track total iterations including tool use to prevent unlimited loops
  let totalIterations = 0;
  const MAX_TOTAL_ITERATIONS = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    totalIterations++;

    // Prevent unlimited tool use loops
    if (totalIterations > MAX_TOTAL_ITERATIONS) {
      throw new Error(`Maximum iterations (${MAX_TOTAL_ITERATIONS}) exceeded. Conversation may be too complex.`);
    }

    const startTime = Date.now();

    try {
      let response: Anthropic.Message;

      // Use streaming API if callback provided, otherwise use standard API
      if (onStream) {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
          tools: TOOL_DEFINITIONS,
        });

        // Stream text chunks to callback as they arrive
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            onStream(chunk.delta.text);
          }
        }

        // Get final complete message
        response = await stream.finalMessage();
      } else {
        // Standard non-streaming API call
        response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024, // Reduced from 2048 for better performance (responses typically 100-300 tokens)
          system: systemPrompt, // Use proper system parameter
          messages: messages,
          tools: TOOL_DEFINITIONS, // Enable tool use
        });
      }

      const latencyMs = Date.now() - startTime;

      // Log Claude API call to Langfuse
      if (trace) {
        logGeneration({
          trace,
          name: `symptom-extraction-attempt-${attempt + 1}`,
          model: response.model,
          input: messages,
          output: response.content,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          latencyMs,
          promptName: 'conversational-extraction-with-tools',
          promptVersion: 'v2',
          metadata: {
            attempt: attempt + 1,
            maxRetries,
            stopReason: response.stop_reason,
          },
        });
      }

      // Handle tool_use responses
      if (response.stop_reason === 'tool_use') {
        // Extract tool use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is ToolUseBlock => block.type === 'tool_use'
        );

        if (toolUseBlocks.length === 0) {
          throw new Error('stop_reason was tool_use but no tool_use blocks found');
        }

        // Log tool use to Langfuse
        if (trace) {
          logEvent({
            trace,
            name: 'tool-use-detected',
            level: 'DEFAULT',
            metadata: {
              toolCount: toolUseBlocks.length,
              tools: toolUseBlocks.map(t => ({ name: t.name, id: t.id })),
            },
          });
        }

        // Execute all tool calls
        const toolResults: ToolResultBlockParam[] = [];

        for (const toolBlock of toolUseBlocks) {
          console.log(`Executing tool: ${toolBlock.name}`, toolBlock.input);

          const toolResult = await executeToolCall(toolBlock.name, toolBlock.input);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: toolResult,
          });

          // Log individual tool execution
          if (trace) {
            logEvent({
              trace,
              name: 'tool-executed',
              level: 'DEFAULT',
              metadata: {
                toolName: toolBlock.name,
                toolId: toolBlock.id,
                input: toolBlock.input,
                resultLength: toolResult.length,
              },
            });
          }
        }

        // Add assistant's tool_use message and tool results to conversation
        messages.push(
          {
            role: 'assistant',
            content: response.content, // Contains tool_use blocks
          },
          {
            role: 'user',
            content: toolResults, // Send tool results back
          }
        );

        // Continue the loop to get Claude's final response after tool use
        // Note: totalIterations already incremented at loop start, will increment again on next iteration
        continue;
      }

      // Standard text response handling
      const textContent = response.content.find(
        (block): block is TextBlock => block.type === 'text'
      );

      if (!textContent) {
        throw new Error('No text content found in response');
      }

      let jsonText = textContent.text.trim();

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

      // Exponential backoff before retry: 100ms, 200ms, 400ms
      const delay = Math.min(100 * Math.pow(2, attempt), 1000);
      await sleep(delay);

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

      // For JSON parse errors or API errors, add retry prompt with exponential backoff
      if (attempt < maxRetries - 1) {
        // Exponential backoff before retry: 100ms, 200ms, 400ms
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);
        await sleep(delay);
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
