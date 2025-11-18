/**
 * Core type definitions for the Conversational Symptom Logger
 */

// Controlled vocabularies - Body locations
export enum Location {
  HEAD = 'head',
  NECK = 'neck',
  THROAT = 'throat',
  JAW = 'jaw',
  EAR = 'ear',
  EYE = 'eye',
  CHEST = 'chest',
  UPPER_BACK = 'upper_back',
  LOWER_BACK = 'lower_back',
  ABDOMEN = 'abdomen',
  SHOULDER = 'shoulder',
  ARM = 'arm',
  ELBOW = 'elbow',
  WRIST = 'wrist',
  HAND = 'hand',
  HIP = 'hip',
  LEG = 'leg',
  KNEE = 'knee',
  ANKLE = 'ankle',
  FOOT = 'foot',
  OTHER = 'other',
}

// Severity is 0-10, but we use a type alias for clarity
export type Severity = number; // 0-10

/**
 * Primary symptom metadata extracted from conversation
 */
export interface SymptomMetadata {
  location: Location;
  onset: string; // ISO date string (YYYY-MM-DD)
  severity: Severity;
  description?: string; // The original user description
}

/**
 * Additional insights about the symptom
 * Collected for more severe or chronic symptoms
 */
export interface AdditionalInsights {
  provocation?: string; // What makes it better or worse?
  quality?: string; // How would you describe it? (sharp, dull, throbbing)
  radiation?: string; // Does the pain spread anywhere?
  timing?: string; // Is it constant or does it come and go?
}

/**
 * Complete symptom entry with primary and additional insights
 */
export interface SymptomEntry {
  id: string;
  timestamp: Date;
  metadata: SymptomMetadata;
  additionalInsights?: AdditionalInsights;
  conversationHistory?: string[]; // Track the conversation for context
}

/**
 * Response from Claude API extraction
 */
export interface ExtractionResponse {
  metadata: SymptomMetadata;
  aiMessage?: string; // AI's conversational response to the user
  conversationComplete?: boolean; // True when AI has all necessary information
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
