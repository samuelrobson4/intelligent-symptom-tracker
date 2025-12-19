// Dialog to view and manage issue details


import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnrichedIssue } from '@/localStorage';
import {
  getSymptoms,
  getIssueStats,
  resolveIssue,
  deleteIssue,
} from '@/localStorage';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueDetailsDialogProps {
  issue: EnrichedIssue | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function IssueDetailsDialog({
  issue,
  open,
  onClose,
  onUpdate,
}: IssueDetailsDialogProps) {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!issue) return null;

  const stats = getIssueStats(issue.id);
  const symptoms = getSymptoms(issue.id);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleResolve = () => {
    if (!endDate) {
      alert('Please enter an end date');
      return;
    }

    try {
      resolveIssue(issue.id, endDate);
      onUpdate();
      setShowResolveForm(false);
      setEndDate('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to resolve issue');
    }
  };

  const handleDelete = () => {
    try {
      deleteIssue(issue.id);
      onUpdate();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete issue');
    }
  };

  // Severity color coding
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'bg-red-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-gray-900">{issue.name}</h4>
                <Badge
                  variant="success"
                  className="text-xs capitalize"
                >
                  {issue.status}
                </Badge>
              </div>
            </div>

            {/* Start/End date info and Statistics */}
            <div className="space-y-1 p-2">
              <p className="text-xs text-gray-500">
                Started on {formatDate(issue.startDate)}
                {issue.endDate && ` • Resolved on ${formatDate(issue.endDate)}`}
              </p>
              <p className="text-xs text-gray-900">
                • <span className="text-gray-500">Total Entries:</span> {stats.totalEntries}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-900">
                <span>•</span>
                <span className="text-gray-500">Avg Severity:</span>
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      getSeverityColor(stats.avgSeverity)
                    )}
                  />
                  <span>{stats.avgSeverity}/10</span>
                </div>
              </div>
              <p className="text-xs text-gray-900">
                • <span className="text-gray-500">Last Entry:</span> {stats.lastEntry ? formatDate(stats.lastEntry) : 'N/A'}
              </p>
            </div>

            {/* Linked Symptoms - expandable */}
            <details className="border-t border-gray-200 pt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900 font-medium">
                Linked Symptoms ({symptoms.length})
              </summary>
              <div className="mt-2 space-y-2">
                {symptoms.length > 0 ? (
                  symptoms
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((symptom) => (
                      <div
                        key={symptom.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-900">
                              {formatDate(symptom.timestamp)}
                            </span>
                            <div className="flex items-center gap-1">
                              <div
                                className={cn(
                                  'h-2 w-2 rounded-full',
                                  getSeverityColor(symptom.metadata.severity)
                                )}
                              />
                              <span className="text-xs text-gray-900">
                                {symptom.metadata.severity}/10
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 capitalize">
                            {symptom.metadata.location.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-gray-500 p-2">No symptoms linked to this issue yet.</p>
                )}
              </div>
            </details>

            {/* Resolve Form */}
            {issue.status === 'active' && showResolveForm && (
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs">Resolution Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="text-xs placeholder:text-xs h-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResolve} className="flex-1 text-xs h-9">
                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                    Confirm Resolution
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResolveForm(false);
                      setEndDate('');
                    }}
                    className="text-xs h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              {issue.status === 'active' && !showResolveForm && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowResolveForm(true);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="text-xs h-9"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                  Mark as Resolved
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs h-9 text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Issue
              </Button>
              <Button variant="outline" onClick={onClose} className="text-xs h-9">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        title="Delete Issue"
        description={`Are you sure you want to delete "${issue.name}"? This will unlink all associated symptoms but won't delete them.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
