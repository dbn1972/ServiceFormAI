import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Plus, Minus, Edit } from 'lucide-react';
import type { ServiceFormSchema } from '../types/externalAPI';

export interface FieldChange {
  field: string;
  change: 'added' | 'removed' | 'modified';
  label: string;
  detail?: string;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  conflictData: {
    currentVersion: number;
    submittedVersion: number;
    changes: FieldChange[] | null;
  };
  existingFormData: Record<string, any>;
  newSchema: ServiceFormSchema;
  onUpdateAndReview: (mappedData: Record<string, any>) => void;
  onDiscardAndStartOver: () => void;
  onClose: () => void;
}

export default function ConflictResolutionDialog({
  open,
  conflictData,
  existingFormData,
  newSchema,
  onUpdateAndReview,
  onDiscardAndStartOver,
  onClose,
}: ConflictResolutionDialogProps) {
  const { currentVersion, submittedVersion, changes } = conflictData;

  const handleUpdateAndReview = () => {
    // Map old data to new schema
    const mappedData: Record<string, any> = {};
    for (const field of newSchema.fields) {
      mappedData[field.id] = existingFormData[field.id] ?? '';
    }
    onUpdateAndReview(mappedData);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
          aria-describedby="conflict-description"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Form Updated While You Were Offline
              </Dialog.Title>
              <p id="conflict-description" className="text-sm text-muted-foreground mt-1">
                The form was updated after you started filling it out.
              </p>
            </div>
          </div>

          {/* Version info */}
          <div className="flex gap-4 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Your version: </span>
              <span className="font-medium">v{submittedVersion}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current version: </span>
              <span className="font-medium text-primary">v{currentVersion}</span>
            </div>
          </div>

          {/* Changes list */}
          {changes === null ? (
            <div className="mb-6 p-4 border border-warning/30 bg-warning/5 rounded-lg text-sm">
              The form has changed significantly. Please start over.
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">What changed:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {changes.map((change) => (
                  <div
                    key={change.field}
                    className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                      change.change === 'added'
                        ? 'bg-success/10 text-success'
                        : change.change === 'removed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {change.change === 'added' ? (
                      <Plus className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : change.change === 'removed' ? (
                      <Minus className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Edit className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-medium">{change.label}</span>
                      {change.detail && (
                        <p className="text-xs opacity-80 mt-0.5">{change.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {changes !== null && (
              <button
                type="button"
                onClick={handleUpdateAndReview}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 text-sm"
              >
                Update and Review
              </button>
            )}
            <button
              type="button"
              onClick={onDiscardAndStartOver}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm ${
                changes === null
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Discard and Start Over
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
