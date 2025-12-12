// Tool handlers for Claude's tool_use API
// Implements get_symptom_history tool with multiple query types

import { SymptomEntry } from './types';
import { getFilteredSymptoms } from './localStorage';
import { SymptomHistoryToolInput } from './types';

// Format a symptom entry for display to Claude
function formatSymptomForDisplay(symptom: SymptomEntry): string {
  const timestamp = symptom.timestamp instanceof Date
    ? symptom.timestamp
    : new Date(symptom.timestamp);

  const daysAgo = Math.floor(
    (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24)
  );

  let result = `Date: ${symptom.metadata.onset} (${daysAgo} days ago)\n`;
  result += `Location: ${symptom.metadata.location}\n`;
  result += `Severity: ${symptom.metadata.severity}/10\n`;

  if (symptom.metadata.description) {
    result += `Description: ${symptom.metadata.description}\n`;
  }

  if (symptom.additionalInsights) {
    const insights: string[] = [];
    if (symptom.additionalInsights.quality) {
      insights.push(`Quality: ${symptom.additionalInsights.quality}`);
    }
    if (symptom.additionalInsights.provocation) {
      insights.push(`Provocation: ${symptom.additionalInsights.provocation}`);
    }
    if (symptom.additionalInsights.radiation) {
      insights.push(`Radiation: ${symptom.additionalInsights.radiation}`);
    }
    if (symptom.additionalInsights.timing) {
      insights.push(`Timing: ${symptom.additionalInsights.timing}`);
    }

    if (insights.length > 0) {
      result += `Additional Info: ${insights.join(', ')}\n`;
    }
  }

  if (symptom.issueId) {
    result += `Linked to Issue ID: ${symptom.issueId}\n`;
  }

  return result;
}

// Execute the get_symptom_history tool
// @param input - Tool input parameters from Claude
// @returns Formatted string of symptom history results
export async function executeGetSymptomHistory(
  input: SymptomHistoryToolInput
): Promise<string> {
  try {
    const { query_type, location, issue_id, days_back = 30, limit = 10 } = input;

    // Validate limits
    const safeDaysBack = Math.min(Math.max(1, days_back), 365);
    const safeLimit = Math.min(Math.max(1, limit), 50);

    let symptoms: SymptomEntry[] = [];

    switch (query_type) {
      case 'recent': {
        // Get most recent symptoms
        const result = getFilteredSymptoms({ limit: safeLimit });
        symptoms = result.symptoms;
        break;
      }

      case 'by_location': {
        if (!location) {
          return 'Error: location parameter is required for by_location query type';
        }

        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - safeDaysBack);
        const startDateStr = startDate.toISOString().split('T')[0];

        const result = getFilteredSymptoms({
          location,
          startDate: startDateStr,
          limit: safeLimit
        });
        symptoms = result.symptoms;
        break;
      }

      case 'by_issue': {
        if (!issue_id) {
          return 'Error: issue_id parameter is required for by_issue query type';
        }

        const result = getFilteredSymptoms({
          issueId: issue_id,
          limit: safeLimit
        });
        symptoms = result.symptoms;
        break;
      }

      case 'by_date_range': {
        // Use days_back to calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - safeDaysBack);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = new Date().toISOString().split('T')[0];

        const result = getFilteredSymptoms({
          startDate: startDateStr,
          endDate: endDateStr,
          limit: safeLimit
        });
        symptoms = result.symptoms;
        break;
      }

      default:
        return `Error: Invalid query_type "${query_type}". Must be one of: recent, by_location, by_issue, by_date_range`;
    }

    // Format results
    if (symptoms.length === 0) {
      return `No symptom entries found for query type "${query_type}"${
        location ? ` with location "${location}"` : ''
      }${issue_id ? ` with issue ID "${issue_id}"` : ''
      } in the last ${safeDaysBack} days.`;
    }

    let result = `Found ${symptoms.length} symptom entr${symptoms.length === 1 ? 'y' : 'ies'}:\n\n`;

    symptoms.forEach((symptom, index) => {
      result += `Entry ${index + 1}:\n`;
      result += formatSymptomForDisplay(symptom);
      result += '\n';
    });

    return result.trim();

  } catch (error) {
    console.error('Error executing get_symptom_history tool:', error);
    return `Error retrieving symptom history: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Route tool execution to the appropriate handler
// @param toolName - Name of the tool to execute
// @param toolInput - Input parameters for the tool
// @returns Tool execution result as string
export async function executeToolCall(
  toolName: string,
  toolInput: unknown
): Promise<string> {
  switch (toolName) {
    case 'get_symptom_history':
      return executeGetSymptomHistory(toolInput as SymptomHistoryToolInput);

    default:
      return `Error: Unknown tool "${toolName}"`;
  }
}
