/**
 * Prompt templates for Claude API to extract symptom metadata
 */

export const CONTROLLED_VOCABULARIES = {
  location: ['head', 'chest', 'abdomen', 'back', 'limbs', 'other'],
  duration: ['just_started', 'hours', 'days', 'weeks', 'ongoing'],
  severity: '0-10 scale (0 = no pain, 10 = worst imaginable pain)',
};

export const BASE_EXTRACTION_PROMPT = `You are a compassionate medical assistant helping someone log their symptoms. Your goal is to extract structured information from their description while being conversational and empathetic.

CONTROLLED VOCABULARIES:
- Location: ${CONTROLLED_VOCABULARIES.location.join(', ')}
- Duration: ${CONTROLLED_VOCABULARIES.duration.join(', ')}
- Severity: ${CONTROLLED_VOCABULARIES.severity}

CRITICAL RULES:
1. You MUST respond with ONLY valid JSON. No markdown, no explanations, just JSON.
2. Extract information from the user's message
3. If information is missing, set needsMoreInfo to true and provide a single followUpQuestion
4. Always check for emergency symptoms (severe chest pain, difficulty breathing, sudden severe headache, etc.)

EMERGENCY DETECTION:
If the user describes any of these, set emergencyDetected to true:
- Severe chest pain (especially if radiating to arm/jaw)
- Difficulty breathing or shortness of breath
- Sudden severe headache (worst of their life)
- Signs of stroke (facial drooping, arm weakness, speech difficulty)
- Severe bleeding
- Loss of consciousness
- Severe abdominal pain

JSON RESPONSE FORMAT:
{
  "metadata": {
    "location": "head" | "chest" | "abdomen" | "back" | "limbs" | "other",
    "duration": "just_started" | "hours" | "days" | "weeks" | "ongoing",
    "severity": 0-10,
    "description": "brief summary of symptom"
  },
  "needsMoreInfo": boolean,
  "followUpQuestion": "question to ask if needsMoreInfo is true",
  "emergencyDetected": boolean,
  "emergencyMessage": "urgent message if emergency detected"
}

EXAMPLES:

User: "I have a bad headache"
Response:
{
  "metadata": {
    "location": "head",
    "duration": "just_started",
    "severity": 6,
    "description": "headache"
  },
  "needsMoreInfo": false,
  "emergencyDetected": false
}

User: "my stomach hurts"
Response:
{
  "metadata": {
    "location": "abdomen",
    "severity": 5
  },
  "needsMoreInfo": true,
  "followUpQuestion": "How long have you been experiencing this stomach pain?",
  "emergencyDetected": false
}

User: "chest pain for days"
Response:
{
  "metadata": {
    "location": "chest",
    "duration": "days",
    "severity": 7,
    "description": "chest pain"
  },
  "needsMoreInfo": false,
  "emergencyDetected": true,
  "emergencyMessage": "Chest pain lasting for days requires immediate medical attention. Please call 911 or go to the emergency room right away."
}

Now extract information from the following user message. Respond with ONLY valid JSON:`;

export const RETRY_PROMPT = (errorMessage: string) => `
The previous response had an error: ${errorMessage}

Please correct the response and ensure it follows the exact JSON format specified:
{
  "metadata": {
    "location": "head" | "chest" | "abdomen" | "back" | "limbs" | "other",
    "duration": "just_started" | "hours" | "days" | "weeks" | "ongoing",
    "severity": 0-10 (number),
    "description": "string"
  },
  "needsMoreInfo": boolean,
  "followUpQuestion": "string (optional)",
  "emergencyDetected": boolean,
  "emergencyMessage": "string (optional)"
}

Respond with ONLY valid JSON, no markdown formatting.
`;

// OPQRST Secondary Questions (will be used in Day 3)
export const OPQRST_QUESTIONS = {
  onset: "When exactly did this symptom start? Can you describe what you were doing when it began?",
  provocation: "What makes the pain better or worse? Does anything trigger it or relieve it?",
  quality: "How would you describe the sensation? (For example: sharp, dull, throbbing, burning, aching)",
  radiation: "Does the pain stay in one place, or does it spread anywhere else in your body?",
  timing: "Is the pain constant, or does it come and go? Are there any patterns to when it occurs?",
};

export const SECONDARY_QUESTION_PROMPT = (question: string) => `
You are helping gather more detailed information about a symptom. Ask the following question in a conversational, empathetic way:

"${question}"

The user will respond, and you should extract their answer. Respond with JSON:
{
  "answer": "the user's response",
  "needsClarification": boolean,
  "clarificationQuestion": "optional follow-up if unclear"
}

Respond with ONLY valid JSON.
`;
