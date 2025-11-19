/**
 * Date utility functions for symptom logging
 */

/**
 * Format an ISO date string (YYYY-MM-DD) to a readable format
 * @param isoDate ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Validate that a date range is valid (start <= end)
 * @param start ISO date string for start date
 * @param end Optional ISO date string for end date
 * @returns true if valid, false otherwise
 */
export function isValidDateRange(start: string, end?: string): boolean {
  if (!end) return true; // No end date is always valid

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate <= endDate;
  } catch {
    return false;
  }
}

/**
 * Calculate the number of days between two dates
 * @param start ISO date string for start date
 * @param end ISO date string for end date
 * @returns Number of days between dates
 */
export function getDaysBetween(start: string, end: string): number {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 * @returns Today's date as ISO string
 */
export function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 * @param date Date object
 * @returns ISO date string
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
