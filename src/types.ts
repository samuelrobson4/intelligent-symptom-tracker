// Core type definitions for the Conversational Symptom Logger

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

// Primary symptom metadata extracted from conversation
export interface SymptomMetadata {
  location: Location;
  onset: string; // ISO date string (YYYY-MM-DD)
  severity: Severity;
  description?: string; // The original user description
}

// Additional insights about the symptom
// Collected for more severe or chronic symptoms
export interface AdditionalInsights {
  provocation?: string; // What makes it better or worse?
  quality?: string; // How would you describe it? (sharp, dull, throbbing)
  radiation?: string; // Does the pain spread anywhere?
  timing?: string; // Is it constant or does it come and go?
}

// Health issue or ongoing condition that groups multiple symptom entries
export interface Issue {
  id: string;
  name: string; // e.g., "Chronic migraines", "Left knee pain"
  status: 'active' | 'resolved';
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date when resolved
  createdAt: Date;
  symptomIds: string[]; // References to SymptomEntry.id
}

// AI suggestion for issue relationship
export interface SuggestedIssue {
  isRelated: boolean; // AI thinks this relates to an issue
  existingIssueId?: string; // ID of matched existing issue
  newIssueName?: string; // Suggested name if creating new issue
  confidence: number; // 0-1 confidence score
}

// Complete symptom entry with primary and additional insights
export interface SymptomEntry {
  id: string;
  timestamp: Date;
  metadata: SymptomMetadata;
  additionalInsights?: AdditionalInsights;
  conversationHistory?: string[]; // Track the conversation for context
  issueId?: string; // Optional reference to parent issue
}

// Issue selection made through conversation
export interface IssueSelection {
  type: 'existing' | 'new' | 'none'; // What the user chose
  existingIssueId?: string; // ID if linking to existing issue
  newIssueName?: string; // Name if creating new issue
  newIssueStartDate?: string; // Start date if creating new issue (ISO YYYY-MM-DD)
}

// Response from Claude API extraction
export interface ExtractionResponse {
  metadata: SymptomMetadata;
  aiMessage?: string; // AI's conversational response to the user
  conversationComplete?: boolean; // True when AI has all necessary information
  suggestedIssue?: SuggestedIssue; // AI's suggestion for issue relationship
  queuedSymptoms?: string[]; // Additional symptoms to log after this one
  issueSelection?: IssueSelection; // User's issue selection made through conversation
}

// Validation result
export interface ValidationResult {
  success: boolean;
  data?: SymptomMetadata;
  error?: string;
  message?: string;
}

// ============================================================================
// TOOL USE API TYPES
// ============================================================================

// Tool definition for Claude's tool_use API
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required: string[];
  };
}

// Query types for symptom history tool
export type SymptomHistoryQueryType = 'recent' | 'by_location' | 'by_issue' | 'by_date_range';

// Input parameters for get_symptom_history tool
export interface SymptomHistoryToolInput {
  query_type: SymptomHistoryQueryType;
  location?: string;
  issue_id?: string;
  days_back?: number;
  limit?: number;
}

// Text block in Claude API messages
export interface TextBlock {
  type: 'text';
  text: string;
}

// Tool use request from Claude
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: SymptomHistoryToolInput;
}

// Tool result to send back to Claude
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

// Extended message content types for tool_use API
export type MessageContent = TextBlock | ToolUseBlock;
export type UserMessageContent = TextBlock | ToolResultBlock;
