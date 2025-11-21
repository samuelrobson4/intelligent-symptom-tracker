/**
 * LocalStorage persistence layer for symptoms and issues
 */

import { SymptomEntry, Issue, SymptomMetadata, AdditionalInsights, SuggestedIssue, IssueSelection } from './types';
import { generateUUID } from './utils/uuid';
import { isValidDateRange } from './utils/dateHelpers';

const STORAGE_KEY = 'symptom_logger_data';
const DRAFT_KEY = 'symptom_logger_draft';

interface StorageData {
  symptoms: SymptomEntry[];
  issues: Issue[];
}

/**
 * Get all data from localStorage
 */
function getData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { symptoms: [], issues: [] };
    }

    const parsed = JSON.parse(data);

    // Convert date strings back to Date objects
    parsed.symptoms = parsed.symptoms.map((s: SymptomEntry) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));

    parsed.issues = parsed.issues.map((i: Issue) => ({
      ...i,
      createdAt: new Date(i.createdAt),
    }));

    return parsed;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { symptoms: [], issues: [] };
  }
}

/**
 * Save all data to localStorage
 */
function setData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Save a symptom entry
 */
export function saveSymptom(entry: SymptomEntry): void {
  const data = getData();

  // Check if symptom with this ID already exists
  const existingIndex = data.symptoms.findIndex(s => s.id === entry.id);

  if (existingIndex >= 0) {
    // Update existing
    data.symptoms[existingIndex] = entry;
  } else {
    // Add new
    data.symptoms.push(entry);
  }

  setData(data);
}

/**
 * Get all symptoms, optionally filtered by issue
 */
export function getSymptoms(issueId?: string): SymptomEntry[] {
  const data = getData();

  if (issueId) {
    return data.symptoms.filter(s => s.issueId === issueId);
  }

  return data.symptoms;
}

/**
 * Get a single symptom by ID
 */
export function getSymptom(id: string): SymptomEntry | null {
  const data = getData();
  return data.symptoms.find(s => s.id === id) || null;
}

/**
 * Delete a symptom by ID
 */
export function deleteSymptom(id: string): void {
  const data = getData();

  // Find the symptom to get its issueId
  const symptom = data.symptoms.find(s => s.id === id);

  // Remove symptom
  data.symptoms = data.symptoms.filter(s => s.id !== id);

  // If symptom was linked to an issue, remove from issue's symptomIds
  if (symptom?.issueId) {
    const issue = data.issues.find(i => i.id === symptom.issueId);
    if (issue) {
      issue.symptomIds = issue.symptomIds.filter(sid => sid !== id);
    }
  }

  setData(data);
}

/**
 * Save an issue
 */
export function saveIssue(issue: Issue): void {
  const data = getData();

  // Validate date range
  if (!isValidDateRange(issue.startDate, issue.endDate)) {
    throw new Error('Invalid date range: end date must be after start date');
  }

  // Check if issue with this ID already exists
  const existingIndex = data.issues.findIndex(i => i.id === issue.id);

  if (existingIndex >= 0) {
    // Update existing
    data.issues[existingIndex] = issue;
  } else {
    // Add new
    data.issues.push(issue);
  }

  setData(data);
}

/**
 * Get all issues, optionally filtered by status
 */
export function getIssues(status?: 'active' | 'resolved'): Issue[] {
  const data = getData();

  if (status) {
    return data.issues.filter(i => i.status === status);
  }

  return data.issues;
}

/**
 * Get a single issue by ID
 */
export function getIssue(id: string): Issue | null {
  const data = getData();
  return data.issues.find(i => i.id === id) || null;
}

/**
 * Update an issue (partial update)
 */
export function updateIssue(id: string, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>): void {
  const data = getData();
  const issueIndex = data.issues.findIndex(i => i.id === id);

  if (issueIndex < 0) {
    throw new Error(`Issue with ID ${id} not found`);
  }

  const updatedIssue = { ...data.issues[issueIndex], ...updates };

  // Validate date range if dates were updated
  if (!isValidDateRange(updatedIssue.startDate, updatedIssue.endDate)) {
    throw new Error('Invalid date range: end date must be after start date');
  }

  data.issues[issueIndex] = updatedIssue;
  setData(data);
}

/**
 * Delete an issue and unlink all associated symptoms
 */
export function deleteIssue(id: string): void {
  const data = getData();

  // Unlink all symptoms
  data.symptoms.forEach(symptom => {
    if (symptom.issueId === id) {
      symptom.issueId = undefined;
    }
  });

  // Remove issue
  data.issues = data.issues.filter(i => i.id !== id);

  setData(data);
}

/**
 * Link a symptom to an issue
 */
export function linkSymptomToIssue(symptomId: string, issueId: string): void {
  const data = getData();

  // Find symptom and issue
  const symptom = data.symptoms.find(s => s.id === symptomId);
  const issue = data.issues.find(i => i.id === issueId);

  if (!symptom) {
    throw new Error(`Symptom with ID ${symptomId} not found`);
  }

  if (!issue) {
    throw new Error(`Issue with ID ${issueId} not found`);
  }

  // Update symptom's issueId
  symptom.issueId = issueId;

  // Add symptom ID to issue's symptomIds if not already there
  if (!issue.symptomIds.includes(symptomId)) {
    issue.symptomIds.push(symptomId);
  }

  setData(data);
}

/**
 * Unlink a symptom from its issue
 */
export function unlinkSymptomFromIssue(symptomId: string): void {
  const data = getData();

  const symptom = data.symptoms.find(s => s.id === symptomId);
  if (!symptom || !symptom.issueId) {
    return; // Nothing to unlink
  }

  // Find the issue and remove symptom ID
  const issue = data.issues.find(i => i.id === symptom.issueId);
  if (issue) {
    issue.symptomIds = issue.symptomIds.filter(sid => sid !== symptomId);
  }

  // Remove issueId from symptom
  symptom.issueId = undefined;

  setData(data);
}

/**
 * Get the most recent symptom entry for an issue
 */
export function getMostRecentSymptomForIssue(issueId: string): SymptomEntry | null {
  const symptoms = getSymptoms(issueId);
  if (symptoms.length === 0) return null;

  // Sort by timestamp descending and return first
  return symptoms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
}

/**
 * Enriched issue with recent symptom information
 */
export interface EnrichedIssue extends Issue {
  lastEntry?: {
    date: string; // ISO date
    daysAgo: number;
    severity: number;
  };
}

/**
 * Get issues enriched with recent symptom data
 */
export function getEnrichedIssues(status?: 'active' | 'resolved'): EnrichedIssue[] {
  const issues = getIssues(status);
  const today = new Date();

  return issues.map((issue) => {
    const recentSymptom = getMostRecentSymptomForIssue(issue.id);

    if (!recentSymptom) {
      return issue; // No symptoms yet
    }

    const symptomDate = typeof recentSymptom.timestamp === 'string'
      ? new Date(recentSymptom.timestamp)
      : recentSymptom.timestamp;

    const daysAgo = Math.floor(
      (today.getTime() - symptomDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...issue,
      lastEntry: {
        date: symptomDate.toISOString().split('T')[0],
        daysAgo,
        severity: recentSymptom.metadata.severity,
      },
    };
  });
}

/**
 * Get symptoms with pagination and filtering
 */
export interface SymptomFilterOptions {
  page?: number;
  limit?: number;
  location?: string;
  severityMin?: number;
  severityMax?: number;
  issueId?: string | null; // null means "no issue", undefined means "any"
  searchQuery?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

export function getFilteredSymptoms(
  options: SymptomFilterOptions = {}
): { symptoms: SymptomEntry[]; total: number } {
  const {
    page = 1,
    limit = 10,
    location,
    severityMin,
    severityMax,
    issueId,
    searchQuery,
    startDate,
    endDate,
  } = options;

  let symptoms = getSymptoms();

  // Apply filters
  if (location) {
    symptoms = symptoms.filter((s) => s.metadata.location === location);
  }

  if (severityMin !== undefined) {
    symptoms = symptoms.filter((s) => s.metadata.severity >= severityMin);
  }

  if (severityMax !== undefined) {
    symptoms = symptoms.filter((s) => s.metadata.severity <= severityMax);
  }

  if (issueId !== undefined) {
    symptoms = symptoms.filter((s) => (issueId === null ? !s.issueId : s.issueId === issueId));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    symptoms = symptoms.filter(
      (s) =>
        s.metadata.description?.toLowerCase().includes(query) ||
        s.metadata.location.toLowerCase().includes(query)
    );
  }

  if (startDate) {
    symptoms = symptoms.filter((s) => s.metadata.onset >= startDate);
  }

  if (endDate) {
    symptoms = symptoms.filter((s) => s.metadata.onset <= endDate);
  }

  // Sort by timestamp descending (most recent first)
  symptoms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const total = symptoms.length;

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const paginatedSymptoms = symptoms.slice(startIndex, startIndex + limit);

  return {
    symptoms: paginatedSymptoms,
    total,
  };
}

/**
 * Get issue statistics
 */
export function getIssueStats(issueId: string): {
  totalEntries: number;
  avgSeverity: number;
  lastEntry: Date | null;
} {
  const symptoms = getSymptoms(issueId);

  if (symptoms.length === 0) {
    return {
      totalEntries: 0,
      avgSeverity: 0,
      lastEntry: null,
    };
  }

  const totalSeverity = symptoms.reduce((sum, s) => sum + s.metadata.severity, 0);
  const avgSeverity = Math.round(totalSeverity / symptoms.length);

  // Sort by timestamp descending
  const sortedSymptoms = symptoms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const lastEntry = sortedSymptoms[0].timestamp;

  return {
    totalEntries: symptoms.length,
    avgSeverity,
    lastEntry,
  };
}

/**
 * Mark an issue as resolved
 */
export function resolveIssue(issueId: string, endDate: string): void {
  updateIssue(issueId, {
    status: 'resolved',
    endDate,
  });
}

/**
 * Generate a new UUID for entities
 */
export { generateUUID };

/**
 * Clear all data (for testing/debugging)
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Draft conversation state for autosave/resume
 */
export interface ConversationDraft {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  extractedMetadata: SymptomMetadata | null;
  additionalInsights: AdditionalInsights;
  queuedSymptoms: string[];
  suggestedIssue: SuggestedIssue | null;
  issueSelection: IssueSelection | null;
  conversationComplete: boolean;
  timestamp: Date;
}

/**
 * Save current conversation state as draft
 */
export function saveDraft(draft: ConversationDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
  }
}

/**
 * Get saved draft from localStorage
 */
export function getDraft(): ConversationDraft | null {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);

    // Convert timestamp back to Date object
    parsed.timestamp = new Date(parsed.timestamp);

    return parsed;
  } catch (error) {
    console.error('Error reading draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved draft
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Error clearing draft from localStorage:', error);
  }
}

/**
 * Check if draft is expired (older than 24 hours)
 */
export function isDraftExpired(draft: ConversationDraft): boolean {
  const now = new Date();
  const draftAge = now.getTime() - draft.timestamp.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  return draftAge > twentyFourHours;
}
