// Dialog to view and edit symptom entry details


import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SymptomEntry, Location } from '@/types';
import { getIssue, saveSymptom } from '@/localStorage';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface SymptomDetailsDialogProps {
  symptom: SymptomEntry | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface EditableFieldProps {
  label: string;
  value: string | number;
  fieldKey: string;
  type?: 'text' | 'number' | 'date';
  enumOptions?: string[];
  onSave: (fieldKey: string, newValue: string | number) => void;
  className?: string;
}

function EditableField({
  label,
  value,
  fieldKey,
  type = 'text',
  enumOptions,
  onSave,
  className
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync localValue when value prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      if (type === 'number') {
        const numValue = Number(localValue);
        // Validate severity range 0-10
        if (fieldKey === 'severity' && (numValue < 0 || numValue > 10)) {
          setLocalValue(value); // Reset to original
          return;
        }
        onSave(fieldKey, numValue);
      } else {
        onSave(fieldKey, localValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors",
        className
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <span className="text-xs text-gray-500 block mb-0.5">{label}</span>
      {isEditing ? (
        enumOptions ? (
          <select
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className="h-9 w-full rounded-md border border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 px-3 text-xs"
            autoFocus
          >
            {enumOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-9 text-xs"
            autoFocus
          />
        )
      ) : (
        <p className="text-xs text-gray-900">
          {type === 'date'
            ? new Date(value).toLocaleDateString()
            : type === 'number'
            ? value
            : value || 'Not specified'}
        </p>
      )}
    </div>
  );
}

export function SymptomDetailsDialog({
  symptom,
  open,
  onClose,
  onUpdate,
}: SymptomDetailsDialogProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const linkedIssue = symptom?.issueId ? getIssue(symptom.issueId) : null;

  // Severity color coding
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'bg-red-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get all location enum values for dropdown
  const locationOptions = Object.values(Location);

  // Debounced save function
  const debouncedSave = useMemo(
    () => {
      let timeoutId: number;
      return (fieldKey: string, newValue: string | number) => {
        if (!symptom) return;

        clearTimeout(timeoutId);
        setSaveStatus('saving');

        timeoutId = setTimeout(() => {
          // Determine which object to update
          const isMetadataField = ['location', 'onset', 'severity', 'description'].includes(
            fieldKey
          );
          const isInsightField = ['provocation', 'quality', 'radiation', 'timing'].includes(
            fieldKey
          );

          const updatedSymptom = { ...symptom };

          if (isMetadataField) {
            updatedSymptom.metadata = {
              ...symptom.metadata,
              [fieldKey]: newValue
            };
          } else if (isInsightField) {
            updatedSymptom.additionalInsights = {
              ...symptom.additionalInsights,
              [fieldKey]: newValue
            };
          }

          // Save to localStorage
          saveSymptom(updatedSymptom);

          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1500);

          // Trigger parent update
          if (onUpdate) {
            onUpdate();
          }
        }, 500);
      };
    },
    [symptom, onUpdate]
  );

  // Check if there are any additional insights to show
  const hasInsights =
    symptom?.additionalInsights?.provocation ||
    symptom?.additionalInsights?.quality ||
    symptom?.additionalInsights?.radiation ||
    symptom?.additionalInsights?.timing;

  // If no symptom, don't render dialog content
  if (!symptom) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <div className="p-4 text-xs text-gray-500">No symptom data available.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 className="text-xs font-semibold text-gray-900">Logged Symptom</h4>
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-green-600 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Saved</span>
                </div>
              )}
              {saveStatus === 'saving' && (
                <span className="text-xs text-gray-500">Saving...</span>
              )}
            </div>
          </div>

          {/* Symptom details in two-column grid */}
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="Location"
              value={symptom.metadata.location}
              fieldKey="location"
              enumOptions={locationOptions}
              onSave={debouncedSave}
            />

            <div className="flex flex-col justify-start p-2">
              <span className="text-xs text-gray-500 block mb-0.5">Severity</span>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    getSeverityColor(symptom.metadata.severity)
                  )}
                />
                <EditableField
                  label=""
                  value={symptom.metadata.severity}
                  fieldKey="severity"
                  type="number"
                  onSave={debouncedSave}
                  className="flex-1 p-0 hover:bg-transparent"
                />
              </div>
            </div>

            <EditableField
              label="Onset Date"
              value={symptom.metadata.onset}
              fieldKey="onset"
              type="date"
              onSave={debouncedSave}
            />

            {symptom.metadata.description && (
              <EditableField
                label="Description"
                value={symptom.metadata.description}
                fieldKey="description"
                onSave={debouncedSave}
              />
            )}

            {linkedIssue && (
              <div className="col-span-2 p-2">
                <span className="text-xs text-gray-500 block mb-1">Linked Issue</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {linkedIssue.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Additional insights - expandable */}
          {hasInsights && (
            <details className="border-t border-gray-200 pt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900 font-medium">
                Additional Details
              </summary>
              <div className="mt-2 space-y-2">
                {symptom.additionalInsights?.provocation && (
                  <EditableField
                    label="Provocation (What makes it better/worse)"
                    value={symptom.additionalInsights.provocation}
                    fieldKey="provocation"
                    onSave={debouncedSave}
                  />
                )}
                {symptom.additionalInsights?.quality && (
                  <EditableField
                    label="Quality (How it feels)"
                    value={symptom.additionalInsights.quality}
                    fieldKey="quality"
                    onSave={debouncedSave}
                  />
                )}
                {symptom.additionalInsights?.radiation && (
                  <EditableField
                    label="Radiation (Where it spreads)"
                    value={symptom.additionalInsights.radiation}
                    fieldKey="radiation"
                    onSave={debouncedSave}
                  />
                )}
                {symptom.additionalInsights?.timing && (
                  <EditableField
                    label="Timing (Constant or intermittent)"
                    value={symptom.additionalInsights.timing}
                    fieldKey="timing"
                    onSave={debouncedSave}
                  />
                )}
              </div>
            </details>
          )}

          {/* Conversation History - expandable */}
          {symptom.conversationHistory && symptom.conversationHistory.length > 0 && (
            <details className="border-t border-gray-200 pt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900 font-medium">
                Conversation History
              </summary>
              <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {symptom.conversationHistory.map((message, index) => (
                  <div key={index} className="text-xs">
                    <p className="text-gray-600 whitespace-pre-wrap">{message}</p>
                    {index < symptom.conversationHistory!.length - 1 && (
                      <div className="border-b border-gray-200 my-2" />
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <Button onClick={onClose} variant="outline" className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
