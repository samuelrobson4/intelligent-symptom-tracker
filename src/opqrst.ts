/**
 * OPQRST secondary questions logic
 * Determines when to ask follow-up questions and manages the question flow
 */

import { SymptomMetadata, Location, Duration, OPQRSTResponses } from './types';
import { OPQRST_QUESTIONS } from './promptTemplates';

/**
 * Critical locations that warrant deeper investigation
 */
const CRITICAL_LOCATIONS = [Location.CHEST, Location.ABDOMEN, Location.HEAD];

/**
 * Determine if secondary OPQRST questions should be triggered
 *
 * Triggers when:
 * - Severity ≥ 7
 * - Duration ≥ "days"
 * - Pain in critical locations (chest, abdomen, head)
 */
export function shouldTriggerSecondary(metadata: SymptomMetadata): boolean {
  // High severity symptoms
  if (metadata.severity >= 7) {
    return true;
  }

  // Long duration symptoms
  if (
    metadata.duration === Duration.DAYS ||
    metadata.duration === Duration.WEEKS ||
    metadata.duration === Duration.ONGOING
  ) {
    return true;
  }

  // Critical location symptoms
  if (CRITICAL_LOCATIONS.includes(metadata.location)) {
    return true;
  }

  return false;
}

/**
 * Get the list of OPQRST questions to ask
 * Returns an array of question keys and text
 */
export function getOPQRSTQuestions(): Array<{
  key: keyof OPQRSTResponses;
  question: string;
}> {
  return [
    { key: 'onset', question: OPQRST_QUESTIONS.onset },
    { key: 'provocation', question: OPQRST_QUESTIONS.provocation },
    { key: 'quality', question: OPQRST_QUESTIONS.quality },
    { key: 'radiation', question: OPQRST_QUESTIONS.radiation },
    { key: 'timing', question: OPQRST_QUESTIONS.timing },
  ];
}

/**
 * Format OPQRST responses for display
 */
export function formatOPQRSTResponses(responses: OPQRSTResponses): string {
  const sections: string[] = [];

  if (responses.onset) {
    sections.push(`Onset: ${responses.onset}`);
  }
  if (responses.provocation) {
    sections.push(`Provocation/Palliation: ${responses.provocation}`);
  }
  if (responses.quality) {
    sections.push(`Quality: ${responses.quality}`);
  }
  if (responses.radiation) {
    sections.push(`Radiation: ${responses.radiation}`);
  }
  if (responses.timing) {
    sections.push(`Timing: ${responses.timing}`);
  }

  return sections.join('\n');
}

/**
 * Get a friendly explanation of why secondary questions are being asked
 */
export function getSecondaryQuestionsRationale(metadata: SymptomMetadata): string {
  const reasons: string[] = [];

  if (metadata.severity >= 7) {
    reasons.push('high severity');
  }

  if (
    metadata.duration === Duration.DAYS ||
    metadata.duration === Duration.WEEKS ||
    metadata.duration === Duration.ONGOING
  ) {
    reasons.push('extended duration');
  }

  if (CRITICAL_LOCATIONS.includes(metadata.location)) {
    reasons.push('critical location');
  }

  if (reasons.length === 0) {
    return 'To help provide better context for your symptom';
  }

  return `Because of the ${reasons.join(' and ')}, I'd like to ask a few more detailed questions to better understand your symptom.`;
}
