// Dialog to view and manage issue details


import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Calendar, Activity, TrendingUp, CheckCircle, Trash2 } from 'lucide-react';

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
    if (severity >= 7) return 'text-red-500';
    if (severity >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle>{issue.name}</DialogTitle>
                <Badge variant={issue.status === 'active' ? 'default' : 'secondary'}>
                  {issue.status}
                </Badge>
              </div>
            </div>
            <DialogDescription>
              Started on {formatDate(issue.startDate)}
              {issue.endDate && ` • Resolved on ${formatDate(issue.endDate)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Total Entries</p>
                </div>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Avg Severity</p>
                </div>
                <p className={`text-2xl font-bold ${getSeverityColor(stats.avgSeverity)}`}>
                  {stats.avgSeverity}/10
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Last Entry</p>
                </div>
                <p className="text-sm font-semibold">
                  {stats.lastEntry ? formatDate(stats.lastEntry) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Linked Symptoms */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">
                Linked Symptoms ({symptoms.length})
              </h4>
              {symptoms.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {symptoms
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((symptom) => (
                      <div
                        key={symptom.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatDate(symptom.timestamp)}
                            </span>
                            <Badge className={`${getSeverityColor(symptom.metadata.severity) === 'text-red-500' ? 'bg-red-500' : getSeverityColor(symptom.metadata.severity) === 'text-yellow-500' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                              {symptom.metadata.severity}/10
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {symptom.metadata.location.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No symptoms linked to this issue yet.</p>
              )}
            </div>

            {/* Resolve Form */}
            {issue.status === 'active' && (
              <div className="border-t pt-4">
                {showResolveForm ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Resolution Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleResolve} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Resolution
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowResolveForm(false);
                          setEndDate('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowResolveForm(true);
                      setEndDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Issue
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
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
