/**
 * Core type definitions for the Conversational Symptom Logger
 */

// Controlled vocabularies
export enum Location {
  HEAD = 'head',
  CHEST = 'chest',
  ABDOMEN = 'abdomen',
  BACK = 'back',
  LIMBS = 'limbs',
  OTHER = 'other',
}

export enum Duration {
  JUST_STARTED = 'just_started',
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  ONGOING = 'ongoing',
}

// Severity is 0-10, but we use a type alias for clarity
export type Severity = number; // 0-10

/**
 * Primary symptom metadata extracted from conversation
 */
export interface SymptomMetadata {
  location: Location;
  duration: Duration;
  severity: Severity;
  description?: string; // The original user description
}

/**
 * OPQRST framework for secondary questions
 */
export interface OPQRSTResponses {
  onset?: string; // When did this start?
  provocation?: string; // What makes it better or worse?
  quality?: string; // How would you describe it? (sharp, dull, throbbing)
  radiation?: string; // Does the pain spread anywhere?
  timing?: string; // Is it constant or does it come and go?
}

/**
 * Complete symptom entry with primary and secondary data
 */
export interface SymptomEntry {
  id: string;
  timestamp: Date;
  metadata: SymptomMetadata;
  secondaryResponses?: OPQRSTResponses;
  conversationHistory?: string[]; // Track the conversation for context
}

/**
 * Response from Claude API extraction
 */
export interface ExtractionResponse {
  metadata: SymptomMetadata;
  needsMoreInfo?: boolean;
  followUpQuestion?: string;
  emergencyDetected?: boolean;
  emergencyMessage?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  data?: SymptomMetadata;
  error?: string;
  message?: string;
}
