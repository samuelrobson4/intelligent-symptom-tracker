// Issue selector component for associating symptoms with health issues


import { useState } from 'react';
import { SuggestedIssue } from '@/types';
import { EnrichedIssue } from '@/localStorage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IssueSelectorProps {
  issues: EnrichedIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string | null) => void;
  suggestedIssue?: SuggestedIssue | null;
  newIssueName?: string;
  onNewIssueNameChange?: (name: string) => void;
  newIssueStartDate?: string;
  onNewIssueStartDateChange?: (date: string) => void;
}

export function IssueSelector({
  issues,
  selectedIssueId,
  onSelectIssue,
  suggestedIssue,
  newIssueName = '',
  onNewIssueNameChange,
  newIssueStartDate = '',
  onNewIssueStartDateChange,
}: IssueSelectorProps) {
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);

  const handleSelectChange = (value: string) => {
    if (value === '__none__') {
      onSelectIssue(null);
      setShowNewIssueForm(false);
    } else if (value === '__new__') {
      onSelectIssue('__new__');
      setShowNewIssueForm(true);

      // Pre-fill with AI suggestion if available
      if (suggestedIssue?.newIssueName && onNewIssueNameChange) {
        onNewIssueNameChange(suggestedIssue.newIssueName);
      }
    } else {
      onSelectIssue(value);
      setShowNewIssueForm(false);
    }
  };

  // Find the suggested issue for display
  const suggestedIssueName = suggestedIssue?.existingIssueId
    ? issues.find(i => i.id === suggestedIssue.existingIssueId)?.name
    : null;

  return (
    <div className="space-y-3">
      {/* AI Suggestion Alert */}
      {suggestedIssue?.isRelated && suggestedIssue.confidence > 0.5 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center gap-2">
              <span>
                {suggestedIssueName
                  ? `AI suggests this relates to "${suggestedIssueName}"`
                  : suggestedIssue.newIssueName
                  ? `AI suggests creating a new issue: "${suggestedIssue.newIssueName}"`
                  : 'AI suggests this may be related to an ongoing issue'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(suggestedIssue.confidence * 100)}% confident
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Issue Select */}
      <div>
        <Label htmlFor="issue-select">Health Issue / Condition (Optional)</Label>
        <Select
          value={selectedIssueId || '__none__'}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="issue-select" className="mt-1">
            <SelectValue placeholder="Select an issue or create new" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No issue (standalone symptom)</SelectItem>
            <SelectItem value="__new__">+ Create new issue</SelectItem>
            {issues.length > 0 && <div className="h-px bg-border my-1" />}
            {issues.map(issue => (
              <SelectItem key={issue.id} value={issue.id}>
                {issue.name} ({issue.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New Issue Form */}
      {showNewIssueForm && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="new-issue-name">Issue Name *</Label>
            <Input
              id="new-issue-name"
              placeholder="e.g., 'Chronic migraines', 'Left knee pain'"
              value={newIssueName}
              onChange={(e) => onNewIssueNameChange?.(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-issue-start">When did this issue start? *</Label>
            <Input
              id="new-issue-start"
              type="date"
              value={newIssueStartDate}
              onChange={(e) => onNewIssueStartDateChange?.(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
