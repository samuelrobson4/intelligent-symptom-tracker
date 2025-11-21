/**
 * Langfuse integration for observability, prompt tracking, and evaluation
 */

import { Langfuse } from 'langfuse';

// Claude pricing per 1M tokens (as of 2025)
const CLAUDE_PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.0, // $3 per 1M input tokens
    output: 15.0, // $15 per 1M output tokens
  },
};

// Initialize Langfuse client
const langfusePublicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
const langfuseSecretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
const langfuseHost = import.meta.env.VITE_LANGFUSE_HOST || 'https://cloud.langfuse.com';
const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

let langfuseClient: Langfuse | null = null;

// Only initialize if API keys are provided
if (langfusePublicKey && langfuseSecretKey) {
  langfuseClient = new Langfuse({
    publicKey: langfusePublicKey,
    secretKey: langfuseSecretKey,
    baseUrl: langfuseHost,
    environment,
  });
  console.log(`Langfuse initialized for ${environment} environment`);
} else {
  console.warn('Langfuse API keys not found. Tracing disabled.');
}

/**
 * Calculate cost for Claude API call
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = CLAUDE_PRICING[model as keyof typeof CLAUDE_PRICING];
  if (!pricing) {
    console.warn(`No pricing data for model: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Create a new trace for a conversation session
 */
export function createTrace(params: {
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}) {
  if (!langfuseClient) return null;

  return langfuseClient.trace({
    id: params.sessionId,
    userId: params.userId,
    metadata: params.metadata,
  });
}

/**
 * Log a Claude API generation within a trace
 */
export function logGeneration(params: {
  trace: ReturnType<typeof createTrace>;
  name: string;
  model: string;
  input: any;
  output: any;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  promptName?: string;
  promptVersion?: string;
  metadata?: Record<string, any>;
}) {
  if (!langfuseClient || !params.trace) return null;

  const cost = calculateCost(params.model, params.inputTokens, params.outputTokens);

  return params.trace.generation({
    name: params.name,
    model: params.model,
    input: params.input,
    output: params.output,
    usage: {
      input: params.inputTokens,
      output: params.outputTokens,
      total: params.inputTokens + params.outputTokens,
      unit: 'TOKENS',
    },
    metadata: {
      ...params.metadata,
      promptName: params.promptName,
      promptVersion: params.promptVersion,
      latencyMs: params.latencyMs,
      cost,
      environment,
    },
  });
}

/**
 * Log a validation failure or retry attempt
 */
export function logEvent(params: {
  trace: ReturnType<typeof createTrace>;
  name: string;
  level: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  metadata?: Record<string, any>;
}) {
  if (!langfuseClient || !params.trace) return;

  params.trace.event({
    name: params.name,
    level: params.level,
    metadata: params.metadata,
  });
}

/**
 * Update trace metadata (e.g., final symptom data)
 */
export function updateTrace(params: {
  trace: ReturnType<typeof createTrace>;
  output?: any;
  metadata?: Record<string, any>;
  tags?: string[];
}) {
  if (!langfuseClient || !params.trace) return;

  params.trace.update({
    output: params.output,
    metadata: params.metadata,
    tags: params.tags,
  });
}

/**
 * Flush all pending Langfuse events (call before app closes)
 */
export async function flushLangfuse() {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
  }
}

/**
 * Check if Langfuse is enabled
 */
export function isLangfuseEnabled(): boolean {
  return langfuseClient !== null;
}

// Export client for advanced usage
export { langfuseClient };
