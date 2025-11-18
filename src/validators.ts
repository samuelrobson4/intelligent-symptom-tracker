/**
 * Validation logic for symptom metadata
 * Ensures Claude's responses conform to controlled vocabularies
 */

import { Location, Duration, SymptomMetadata, ValidationResult } from './types';

/**
 * Check if a value is a valid Location enum value
 */
function isValidLocation(value: unknown): value is Location {
  return (
    typeof value === 'string' &&
    Object.values(Location).includes(value as Location)
  );
}

/**
 * Check if a value is a valid Duration enum value
 */
function isValidDuration(value: unknown): value is Duration {
  return (
    typeof value === 'string' &&
    Object.values(Duration).includes(value as Duration)
  );
}

/**
 * Check if a value is a valid Severity (0-10)
 */
function isValidSeverity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    value >= 0 &&
    value <= 10 &&
    Number.isInteger(value)
  );
}

/**
 * Parse and validate symptom metadata from Claude's response
 * Returns either validated data or an error message
 */
export function parseAndValidate(data: unknown): ValidationResult {
  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Invalid response format',
        message: 'Response must be a valid JSON object',
      };
    }

    const response = data as Record<string, unknown>;

    // Check for metadata field
    if (!response.metadata || typeof response.metadata !== 'object') {
      return {
        success: false,
        error: 'Missing metadata',
        message: 'Response must include a "metadata" field',
      };
    }

    const metadata = response.metadata as Record<string, unknown>;

    // Validate location
    if (!isValidLocation(metadata.location)) {
      return {
        success: false,
        error: 'Invalid location',
        message: `Location must be one of: ${Object.values(Location).join(', ')}. Received: ${metadata.location}`,
      };
    }

    // Validate duration (optional in some cases)
    if (metadata.duration !== undefined && !isValidDuration(metadata.duration)) {
      return {
        success: false,
        error: 'Invalid duration',
        message: `Duration must be one of: ${Object.values(Duration).join(', ')}. Received: ${metadata.duration}`,
      };
    }

    // Validate severity (optional in some cases)
    if (metadata.severity !== undefined && !isValidSeverity(metadata.severity)) {
      return {
        success: false,
        error: 'Invalid severity',
        message: `Severity must be an integer between 0 and 10. Received: ${metadata.severity}`,
      };
    }

    // Build validated metadata object
    const validatedMetadata: SymptomMetadata = {
      location: metadata.location,
      duration: metadata.duration as Duration,
      severity: metadata.severity as number,
      description: typeof metadata.description === 'string' ? metadata.description : undefined,
    };

    return {
      success: true,
      data: validatedMetadata,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Validation error',
      message: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate that a JSON string is properly formatted
 */
export function validateJSON(jsonString: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Generate a helpful error message for the model to correct its response
 */
export function generateErrorFeedback(validationResult: ValidationResult): string {
  if (validationResult.success) {
    return '';
  }

  let feedback = `Error: ${validationResult.error}\n`;
  feedback += validationResult.message || '';
  feedback += '\n\nPlease ensure your response:';
  feedback += '\n1. Is valid JSON';
  feedback += '\n2. Contains a "metadata" object';
  feedback += '\n3. Uses only allowed values from the controlled vocabularies';
  feedback += `\n   - Location: ${Object.values(Location).join(', ')}`;
  feedback += `\n   - Duration: ${Object.values(Duration).join(', ')}`;
  feedback += '\n   - Severity: integer from 0 to 10';

  return feedback;
}
