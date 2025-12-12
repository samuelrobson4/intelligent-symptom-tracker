// Validation logic for symptom metadata
// Ensures Claude's responses conform to controlled vocabularies


import { Location, SymptomMetadata, ValidationResult } from './types';

// Check if a value is a valid Location enum value

function isValidLocation(value: unknown): value is Location {
  return (
    typeof value === 'string' &&
    Object.values(Location).includes(value as Location)
  );
}

// Check if a value is a valid Severity (0-10)

function isValidSeverity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    value >= 0 &&
    value <= 10 &&
    Number.isInteger(value)
  );
}

// Check if a value is a valid ISO date string (YYYY-MM-DD)

function isValidOnsetDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  // Check format YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(value)) return false;

  // Check if it's a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;

  // Check if the date isn't in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (date > today) return false;

  return true;
}

// Parse and validate symptom metadata from Claude's response
// Returns either validated data or an error message
// Note: Fields can be null if not yet collected in conversation

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

    // Validate location (allow null during conversation)
    if (metadata.location !== null && !isValidLocation(metadata.location)) {
      return {
        success: false,
        error: 'Invalid location',
        message: `Location must be one of: ${Object.values(Location).join(', ')}, or null. Received: ${metadata.location}`,
      };
    }

    // Validate onset (allow null during conversation)
    if (metadata.onset !== null && !isValidOnsetDate(metadata.onset)) {
      return {
        success: false,
        error: 'Invalid onset',
        message: `Onset must be a valid ISO date (YYYY-MM-DD) not in the future, or null. Received: ${metadata.onset}`,
      };
    }

    // Validate severity (allow null during conversation)
    if (metadata.severity !== null && !isValidSeverity(metadata.severity)) {
      return {
        success: false,
        error: 'Invalid severity',
        message: `Severity must be an integer between 0 and 10, or null. Received: ${metadata.severity}`,
      };
    }

    // Build validated metadata object
    const validatedMetadata: SymptomMetadata = {
      location: metadata.location as Location,
      onset: metadata.onset as string,
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

// Validate that a JSON string is properly formatted

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

// Generate a helpful error message for the model to correct its response

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
  feedback += `\n   - Location: ${Object.values(Location).join(', ')} (or null if not yet known)`;
  feedback += '\n   - Onset: ISO date YYYY-MM-DD not in the future (or null if not yet known)';
  feedback += '\n   - Severity: integer from 0 to 10 (or null if not yet known)';

  return feedback;
}
