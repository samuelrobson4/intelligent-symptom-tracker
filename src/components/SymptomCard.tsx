// Editable symptom card component
// Displays inline in chat after symptom is logged

import { useState, useMemo } from 'react';
import { SymptomMetadata, AdditionalInsights, SymptomEntry, Location } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SymptomCardProps {
  symptomId: string;
  metadata: SymptomMetadata;
  additionalInsights: AdditionalInsights;
  issueId?: string;
  issueName?: string;
  onUpdate: (symptomId: string, updates: Partial<SymptomEntry>) => void;
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
            className="h-9"
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

export function SymptomCard({
  symptomId,
  metadata,
  additionalInsights,
  issueName,
  onUpdate
}: SymptomCardProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced save function
  const debouncedSave = useMemo(
    () => {
      let timeoutId: number;
      return (fieldKey: string, newValue: string | number) => {
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

          if (isMetadataField) {
            onUpdate(symptomId, {
              metadata: { ...metadata, [fieldKey]: newValue }
            });
          } else if (isInsightField) {
            onUpdate(symptomId, {
              additionalInsights: { ...additionalInsights, [fieldKey]: newValue }
            });
          }

          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1500);
        }, 500);
      };
    },
    [symptomId, metadata, additionalInsights, onUpdate]
  );

  // Get severity badge color
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'bg-red-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get all location enum values for dropdown
  const locationOptions = Object.values(Location);

  // Check if there are any additional insights to show
  const hasInsights =
    additionalInsights.provocation ||
    additionalInsights.quality ||
    additionalInsights.radiation ||
    additionalInsights.timing;

  return (
    <div className="flex justify-start mb-2.5">
      <div className="max-w-[80%] w-full bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
        {/* Header with save indicator */}
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
            value={metadata.location}
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
                  getSeverityColor(metadata.severity)
                )}
              />
              <EditableField
                label=""
                value={metadata.severity}
                fieldKey="severity"
                type="number"
                onSave={debouncedSave}
                className="flex-1 p-0 hover:bg-transparent"
              />
            </div>
          </div>

          <EditableField
            label="Onset Date"
            value={metadata.onset}
            fieldKey="onset"
            type="date"
            onSave={debouncedSave}
          />

          {metadata.description && (
            <EditableField
              label="Description"
              value={metadata.description}
              fieldKey="description"
              onSave={debouncedSave}
            />
          )}

          {issueName && (
            <div className="col-span-2 p-2">
              <span className="text-xs text-gray-500 block mb-1">Linked Issue</span>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {issueName}
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
              {additionalInsights.provocation && (
                <EditableField
                  label="Provocation (What makes it better/worse)"
                  value={additionalInsights.provocation}
                  fieldKey="provocation"
                  onSave={debouncedSave}
                />
              )}
              {additionalInsights.quality && (
                <EditableField
                  label="Quality (How it feels)"
                  value={additionalInsights.quality}
                  fieldKey="quality"
                  onSave={debouncedSave}
                />
              )}
              {additionalInsights.radiation && (
                <EditableField
                  label="Radiation (Where it spreads)"
                  value={additionalInsights.radiation}
                  fieldKey="radiation"
                  onSave={debouncedSave}
                />
              )}
              {additionalInsights.timing && (
                <EditableField
                  label="Timing (Constant or intermittent)"
                  value={additionalInsights.timing}
                  fieldKey="timing"
                  onSave={debouncedSave}
                />
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
