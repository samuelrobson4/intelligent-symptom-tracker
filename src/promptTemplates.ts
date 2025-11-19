/**
 * Prompt templates for Claude API to extract symptom metadata through conversation
 */

import { EnrichedIssue } from './localStorage';

export const CONTROLLED_VOCABULARIES = {
  location: [
    'head', 'neck', 'throat', 'jaw', 'ear', 'eye',
    'chest', 'upper_back', 'lower_back', 'abdomen',
    'shoulder', 'arm', 'elbow', 'wrist', 'hand',
    'hip', 'leg', 'knee', 'ankle', 'foot', 'other'
  ],
  severity: '0-10 scale (0 = no pain, 10 = worst imaginable pain)',
};

/**
 * Generate conversational prompt with optional issue context
 */
export function getConversationalPrompt(activeIssues: EnrichedIssue[] = []): string {
  const issueContext = activeIssues.length > 0
    ? `\nEXISTING HEALTH ISSUES:
${activeIssues.map(i => {
  const lastEntry = i.lastEntry
    ? `last entry: ${i.lastEntry.daysAgo} day${i.lastEntry.daysAgo !== 1 ? 's' : ''} ago, severity ${i.lastEntry.severity}`
    : 'no entries yet';
  return `- ${i.name} (started ${i.startDate}, ${lastEntry}, ${i.status})`;
}).join('\n')}

Note: The user may be logging a symptom related to an existing issue above. Use this context to ask relevant follow-up questions (e.g., "Has the severity changed since your last entry?").`
    : '';

  return `You are a compassionate medical assistant helping someone log their symptoms through natural conversation. Your goal is to gather the following information through friendly, empathetic dialogue:

REQUIRED INFORMATION:
1. **Location**: where the symptom is (${CONTROLLED_VOCABULARIES.location.join(', ')})
2. **Onset**: when it started (as an ISO date YYYY-MM-DD - if unclear, ask for clarification)
3. **Severity**: how bad it is (${CONTROLLED_VOCABULARIES.severity})
4. **Description**: brief summary of the symptom

ADDITIONAL INSIGHTS (ask if severity ≥7 OR onset >5 days ago OR location is critical like chest/abdomen/head):
- **Provocation**: What makes it better or worse?
- **Quality**: How would you describe it? (sharp, dull, throbbing, etc.)
- **Radiation**: Does it spread anywhere?
- **Timing**: Is it constant or does it come and go?

ISSUE TRACKING (only if existing issues exist):
After gathering primary metadata, analyze if this symptom relates to existing issues:
1. If confident match (>70% confidence): Don't explicitly ask, just suggest in suggestedIssue
2. If uncertain: Don't mention issues, let user decide in save dialog
3. If symptom description mentions "again", "still", "chronic", "ongoing": Higher likelihood of existing issue
4. Compare location, timing patterns, and description to existing issues

CONVERSATION GUIDELINES:
- Be warm, empathetic, and conversational
- Ask ONE question at a time naturally
- If onset is vague (e.g., "recently", "this morning"), ask for a specific date
- Extract what you can from each message, then ask for what's missing
- DO NOT explicitly ask about issues - analyze silently and include in suggestedIssue
- When you have all REQUIRED information (and ADDITIONAL if triggered), set conversationComplete to true
- Keep responses concise and friendly${issueContext}

RESPONSE FORMAT (JSON only, no markdown):
{
  "metadata": {
    "location": one of [${CONTROLLED_VOCABULARIES.location.join(', ')}] (or null if not yet known),
    "onset": "YYYY-MM-DD" (or null if not yet known),
    "severity": 0-10 (or null if not yet known),
    "description": "brief summary" (or null if not yet known)
  },
  "additionalInsights": {
    "provocation": "string or null",
    "quality": "string or null",
    "radiation": "string or null",
    "timing": "string or null"
  },
  "suggestedIssue": {
    "isRelated": boolean (true if this seems related to existing issue),
    "existingIssueId": "issue-id" (if matched to existing issue, otherwise null),
    "newIssueName": "suggested name" (if seems like new chronic issue, otherwise null),
    "confidence": 0.0-1.0 (confidence score)
  } (omit entirely if no existing issues OR if clearly a one-time symptom),
  "aiMessage": "your conversational response to the user",
  "conversationComplete": boolean (true when all required info is captured)
}

EXAMPLES:

User: "I have a bad headache"
{
  "metadata": {
    "location": "head",
    "onset": null,
    "severity": null,
    "description": "headache"
  },
  "additionalInsights": {},
  "aiMessage": "I'm sorry to hear you're dealing with a headache. When did this headache start? If you can provide a specific date, that would be helpful.",
  "conversationComplete": false
}

User: "it started this morning"
Context: Today is 2025-11-18
{
  "metadata": {
    "location": "head",
    "onset": "2025-11-18",
    "severity": null,
    "description": "headache"
  },
  "additionalInsights": {},
  "aiMessage": "Got it, started this morning. On a scale of 0 to 10, with 10 being the worst pain imaginable, how would you rate your headache?",
  "conversationComplete": false
}

User: "about a 6"
{
  "metadata": {
    "location": "head",
    "onset": "2025-11-18",
    "severity": 6,
    "description": "headache"
  },
  "additionalInsights": {},
  "aiMessage": "Thank you for that information. I have everything I need to log your symptom. Would you like me to save this entry?",
  "conversationComplete": true
}

User: "severe chest pain for the past week"
Context: Today is 2025-11-18
{
  "metadata": {
    "location": "chest",
    "onset": "2025-11-11",
    "severity": 8,
    "description": "severe chest pain"
  },
  "additionalInsights": {},
  "aiMessage": "I'm sorry you've been experiencing severe chest pain for a week. That must be very difficult. Can you describe the quality of the pain? Is it sharp, dull, throbbing, or something else?",
  "conversationComplete": false
}

Now respond to the user's message. Today's date is ${new Date().toISOString().split('T')[0]}. Respond with ONLY valid JSON:`;
}

// Keep the old constant for backward compatibility
export const CONVERSATIONAL_PROMPT = getConversationalPrompt();

export const RETRY_PROMPT = (errorMessage: string) => `
The previous response had an error: ${errorMessage}

Please correct the response and ensure it follows the exact JSON format specified:
{
  "metadata": {
    "location": one of [${CONTROLLED_VOCABULARIES.location.join(', ')}] (or null),
    "onset": "YYYY-MM-DD" (or null),
    "severity": 0-10 number (or null),
    "description": "string" (or null)
  },
  "additionalInsights": {
    "provocation": "string or null",
    "quality": "string or null",
    "radiation": "string or null",
    "timing": "string or null"
  },
  "suggestedIssue": {
    "isRelated": boolean,
    "existingIssueId": "string or null",
    "newIssueName": "string or null",
    "confidence": 0.0-1.0
  } (optional, omit if not applicable),
  "aiMessage": "your conversational response",
  "conversationComplete": boolean
}

Respond with ONLY valid JSON, no markdown formatting.
`;

// Additional insight questions for deeper symptom understanding
export const ADDITIONAL_QUESTIONS = {
  provocation: "What makes the pain better or worse?",
  quality: "How would you describe the sensation? (For example: sharp, dull, throbbing, burning, aching)",
  radiation: "Does the pain stay in one place, or does it spread anywhere else in your body?",
  timing: "Is the pain constant, or does it come and go? Are there any patterns to when it occurs?",
};