/**
 * LivePreview — Real-time form preview using DynamicFormRenderer.
 *
 * Converts BuilderState to ServiceFormSchema via SchemaExporter,
 * renders via DynamicFormRenderer with submission disabled,
 * and provides viewport width toggle (375px / 768px / 1024px).
 */

import { useMemo, useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, Eye } from 'lucide-react';
import type { BuilderState } from './types';
import { exportSchema } from '../../utils/schemaExporter';
import DynamicFormRenderer from '../DynamicFormRenderer';
import toast from '../../utils/toast';

// ---------------------------------------------------------------------------
// Viewport presets
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { key: 'mobile', label: 'Mobile', width: 375, icon: Smartphone },
  { key: 'tablet', label: 'Tablet', width: 768, icon: Tablet },
  { key: 'desktop', label: 'Desktop', width: 1024, icon: Monitor },
] as const;

type ViewportKey = (typeof VIEWPORTS)[number]['key'];

// ---------------------------------------------------------------------------
// LivePreview component
// ---------------------------------------------------------------------------

interface LivePreviewProps {
  builderState: BuilderState;
  tenantId: string;
}

export default function LivePreview({ builderState, tenantId }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportKey>('desktop');

  // Convert BuilderState to ServiceFormSchema
  const schema = useMemo(() => {
    try {
      return exportSchema(builderState);
    } catch {
      return null;
    }
  }, [builderState]);

  // Preview-mode submit handler — shows message instead of submitting
  const handlePreviewSubmit = useCallback(async () => {
    toast.info('Submission disabled in preview mode', {
      description: 'This is a preview. Save and publish the form to enable submissions.',
    });
  }, []);

  const currentViewport = VIEWPORTS.find((v) => v.key === viewport)!;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      role="region"
      aria-label="Live Preview"
    >
      {/* Header with viewport toggle */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Preview</h3>
        </div>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Viewport size">
          {VIEWPORTS.map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.key}
                type="button"
                role="radio"
                aria-checked={viewport === vp.key}
                aria-label={`${vp.label} (${vp.width}px)`}
                onClick={() => setViewport(vp.key)}
                className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
                  ${viewport === vp.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 bg-muted/30">
        <div
          className="mx-auto bg-background border border-border rounded-lg shadow-sm overflow-hidden transition-all duration-200"
          style={{
            maxWidth: `${currentViewport.width}px`,
            width: '100%',
          }}
        >
          <div className="p-4">
            {schema ? (
              <DynamicFormRenderer
                schema={schema}
                onSubmit={handlePreviewSubmit}
                tenantId={tenantId}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Add fields to see a preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
