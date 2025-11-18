/**
 * Additional insights collection logic
 * Determines when to ask deeper follow-up questions and manages the question flow
 */

import { SymptomMetadata, Location, AdditionalInsights } from './types';
import { ADDITIONAL_QUESTIONS } from './promptTemplates';

/**
 * Critical locations that warrant deeper investigation
 */
const CRITICAL_LOCATIONS = [Location.CHEST, Location.ABDOMEN, Location.HEAD];

/**
 * Calculate days since onset from ISO date string
 */
function getDaysSinceOnset(onsetDate: string): number {
  const onset = new Date(onsetDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - onset.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine if additional insight questions should be triggered
 *
 * Triggers when:
 * - Severity ≥ 7
 * - Onset > 5 days ago
 * - Pain in critical locations (chest, abdomen, head)
 */
export function shouldCollectAdditionalInsights(metadata: SymptomMetadata): boolean {
  // High severity symptoms
  if (metadata.severity >= 7) {
    return true;
  }

  // Long duration symptoms (onset more than 5 days ago)
  if (metadata.onset) {
    const daysSince = getDaysSinceOnset(metadata.onset);
    if (daysSince > 5) {
      return true;
    }
  }

  // Critical location symptoms
  if (CRITICAL_LOCATIONS.includes(metadata.location)) {
    return true;
  }

  return false;
}

/**
 * Get the list of additional insight questions to ask
 * Returns an array of question keys and text
 */
export function getAdditionalQuestions(): Array<{
  key: keyof AdditionalInsights;
  question: string;
}> {
  return [
    { key: 'provocation', question: ADDITIONAL_QUESTIONS.provocation },
    { key: 'quality', question: ADDITIONAL_QUESTIONS.quality },
    { key: 'radiation', question: ADDITIONAL_QUESTIONS.radiation },
    { key: 'timing', question: ADDITIONAL_QUESTIONS.timing },
  ];
}

/**
 * Format additional insights for display
 */
export function formatAdditionalInsights(insights: AdditionalInsights): string {
  const sections: string[] = [];

  if (insights.provocation) {
    sections.push(`Provocation/Palliation: ${insights.provocation}`);
  }
  if (insights.quality) {
    sections.push(`Quality: ${insights.quality}`);
  }
  if (insights.radiation) {
    sections.push(`Radiation: ${insights.radiation}`);
  }
  if (insights.timing) {
    sections.push(`Timing: ${insights.timing}`);
  }

  return sections.join('\n');
}

/**
 * Get a friendly explanation of why additional questions are being asked
 */
export function getAdditionalQuestionsRationale(metadata: SymptomMetadata): string {
  const reasons: string[] = [];

  if (metadata.severity >= 7) {
    reasons.push('high severity');
  }

  if (metadata.onset) {
    const daysSince = getDaysSinceOnset(metadata.onset);
    if (daysSince > 5) {
      reasons.push('extended duration');
    }
  }

  if (CRITICAL_LOCATIONS.includes(metadata.location)) {
    reasons.push('critical location');
  }

  if (reasons.length === 0) {
    return 'To help provide better context for your symptom';
  }

  return `Because of the ${reasons.join(' and ')}, I'd like to ask a few more detailed questions to better understand your symptom.`;
}
