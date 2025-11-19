/**
 * Dialog to view full symptom entry details
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SymptomEntry } from '@/types';
import { getIssue } from '@/localStorage';
import { Calendar, MapPin, Activity, MessageSquare, Link as LinkIcon } from 'lucide-react';

interface SymptomDetailsDialogProps {
  symptom: SymptomEntry | null;
  open: boolean;
  onClose: () => void;
}

export function SymptomDetailsDialog({
  symptom,
  open,
  onClose,
}: SymptomDetailsDialogProps) {
  if (!symptom) return null;

  const linkedIssue = symptom.issueId ? getIssue(symptom.issueId) : null;

  // Severity color coding
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'bg-red-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Symptom Details</DialogTitle>
            <Badge className={`${getSeverityColor(symptom.metadata.severity)} text-white`}>
              Severity {symptom.metadata.severity}/10
            </Badge>
          </div>
          <DialogDescription>
            Logged on {formatDate(symptom.timestamp)} at {formatTime(symptom.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Primary Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {symptom.metadata.location.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Onset Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(symptom.metadata.onset)}
                </p>
              </div>
            </div>

            {symptom.metadata.description && (
              <div className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {symptom.metadata.description}
                  </p>
                </div>
              </div>
            )}

            {linkedIssue && (
              <div className="flex items-start gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Linked Issue</p>
                  <Badge variant="secondary">{linkedIssue.name}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Additional Insights */}
          {symptom.additionalInsights && Object.keys(symptom.additionalInsights).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Additional Insights</h4>
              <div className="space-y-3">
                {symptom.additionalInsights.provocation && (
                  <div>
                    <p className="text-sm font-medium">Provocation</p>
                    <p className="text-sm text-muted-foreground">
                      {symptom.additionalInsights.provocation}
                    </p>
                  </div>
                )}
                {symptom.additionalInsights.quality && (
                  <div>
                    <p className="text-sm font-medium">Quality</p>
                    <p className="text-sm text-muted-foreground">
                      {symptom.additionalInsights.quality}
                    </p>
                  </div>
                )}
                {symptom.additionalInsights.radiation && (
                  <div>
                    <p className="text-sm font-medium">Radiation</p>
                    <p className="text-sm text-muted-foreground">
                      {symptom.additionalInsights.radiation}
                    </p>
                  </div>
                )}
                {symptom.additionalInsights.timing && (
                  <div>
                    <p className="text-sm font-medium">Timing</p>
                    <p className="text-sm text-muted-foreground">
                      {symptom.additionalInsights.timing}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {symptom.conversationHistory && symptom.conversationHistory.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Conversation History</h4>
              </div>
              <div className="space-y-2 bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {symptom.conversationHistory.map((message, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-muted-foreground whitespace-pre-wrap">{message}</p>
                    {index < symptom.conversationHistory!.length - 1 && (
                      <div className="border-b my-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
