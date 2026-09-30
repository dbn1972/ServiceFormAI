/**
 * PropertyPanel — Right-side panel for editing field properties or form-level settings.
 *
 * When a field is selected: displays base property editors, type-specific editors,
 * ValidationRuleBuilder, ConditionalLogicBuilder, and layout colSpan selector.
 * When no field is selected: displays form-level settings and CrossFieldRuleBuilder.
 */

import { Settings, Sliders } from 'lucide-react';
import type {
  BuilderField,
  BuilderState,
  BuilderCrossFieldRule,
  FormSettings,
  SpacingToken,
  FieldOption,
} from './types';
import ValidationRuleBuilder from './ValidationRuleBuilder';
import ConditionalLogicBuilder from './ConditionalLogicBuilder';
import CrossFieldRuleBuilder from './CrossFieldRuleBuilder';

// ---------------------------------------------------------------------------
// OptionsEditor — for dropdown/radio fields
// ---------------------------------------------------------------------------

function OptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}) {
  const addOption = () => {
    const idx = options.length + 1;
    onChange([...options, { value: `option${idx}`, label: `Option ${idx}` }]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...updates } : o)));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Options</label>
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={opt.value}
            onChange={(e) => updateOption(i, { value: e.target.value })}
            placeholder="Value"
            className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={`Option ${i + 1} value`}
          />
          <input
            type="text"
            value={opt.label}
            onChange={(e) => updateOption(i, { label: e.target.value })}
            placeholder="Label"
            className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={`Option ${i + 1} label`}
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            className="px-2 py-1 text-sm text-destructive hover:bg-destructive/10 rounded"
            aria-label={`Remove option ${i + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="text-sm text-primary hover:underline"
      >
        + Add Option
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyPanel
// ---------------------------------------------------------------------------

interface PropertyPanelProps {
  selectedField: BuilderField | null;
  builderState: BuilderState;
  onUpdateField: (fieldId: string, updates: Partial<BuilderField>) => void;
  onUpdateFormSettings: (updates: Partial<FormSettings>) => void;
  onAddCrossFieldRule: (rule: BuilderCrossFieldRule) => void;
  onUpdateCrossFieldRule: (index: number, rule: BuilderCrossFieldRule) => void;
  onRemoveCrossFieldRule: (index: number) => void;
}

export default function PropertyPanel({
  selectedField,
  builderState,
  onUpdateField,
  onUpdateFormSettings,
  onAddCrossFieldRule,
  onUpdateCrossFieldRule,
  onRemoveCrossFieldRule,
}: PropertyPanelProps) {
  const columns = builderState.formSettings.columns;

  // ---------------------------------------------------------------------------
  // Field-level editing
  // ---------------------------------------------------------------------------

  if (selectedField) {
    return (
      <div
        className="flex flex-col h-full overflow-hidden"
        role="region"
        aria-label="Field Properties"
      >
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Sliders className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Field Properties</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Base properties */}
          <div className="space-y-3">
            <div>
              <label htmlFor="field-label" className="text-sm font-medium block mb-1">
                Label
              </label>
              <input
                id="field-label"
                type="text"
                value={selectedField.label}
                onChange={(e) =>
                  onUpdateField(selectedField.id, { label: e.target.value })
                }
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="field-placeholder" className="text-sm font-medium block mb-1">
                Placeholder
              </label>
              <input
                id="field-placeholder"
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) =>
                  onUpdateField(selectedField.id, {
                    placeholder: e.target.value || undefined,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="field-helptext" className="text-sm font-medium block mb-1">
                Help Text
              </label>
              <input
                id="field-helptext"
                type="text"
                value={selectedField.helpText || ''}
                onChange={(e) =>
                  onUpdateField(selectedField.id, {
                    helpText: e.target.value || undefined,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="field-required"
                type="checkbox"
                checked={selectedField.required}
                onChange={(e) =>
                  onUpdateField(selectedField.id, { required: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="field-required" className="text-sm font-medium">
                Required
              </label>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Field ID</label>
              <div className="px-2 py-1.5 text-sm bg-muted rounded text-muted-foreground">
                {selectedField.id}
              </div>
            </div>
          </div>

          {/* Options editor for dropdown/radio */}
          {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
            <div className="border-t border-border pt-3">
              <OptionsEditor
                options={selectedField.options || []}
                onChange={(options) =>
                  onUpdateField(selectedField.id, { options })
                }
              />
            </div>
          )}

          {/* Layout — colSpan */}
          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-medium mb-2">Layout</h4>
            <div>
              <label htmlFor="field-colspan" className="text-xs text-muted-foreground block mb-1">
                Column Span (1–{columns})
              </label>
              <select
                id="field-colspan"
                value={selectedField.colSpan || 1}
                onChange={(e) =>
                  onUpdateField(selectedField.id, {
                    colSpan: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: columns }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} column{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation */}
          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-medium mb-2">Validation</h4>
            <ValidationRuleBuilder
              field={selectedField}
              onUpdate={(validation) =>
                onUpdateField(selectedField.id, { validation })
              }
            />
          </div>

          {/* Conditional Visibility */}
          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-medium mb-2">Conditional Visibility</h4>
            <ConditionalLogicBuilder
              field={selectedField}
              allFields={builderState.fields}
              onUpdate={(conditional) =>
                onUpdateField(selectedField.id, { conditional: conditional || undefined })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form-level settings (no field selected)
  // ---------------------------------------------------------------------------

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      role="region"
      aria-label="Form Settings"
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Form Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label htmlFor="form-name" className="text-sm font-medium block mb-1">
            Form Name
          </label>
          <input
            id="form-name"
            type="text"
            value={builderState.metadata.serviceName}
            onChange={() => {
              // Metadata updates handled through form settings
            }}
            readOnly
            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-muted text-muted-foreground"
          />
        </div>

        <div>
          <label htmlFor="form-columns" className="text-sm font-medium block mb-1">
            Columns
          </label>
          <select
            id="form-columns"
            value={builderState.formSettings.columns}
            onChange={(e) =>
              onUpdateFormSettings({ columns: parseInt(e.target.value, 10) })
            }
            className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} column{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="form-gap" className="text-sm font-medium block mb-1">
            Gap Spacing
          </label>
          <select
            id="form-gap"
            value={builderState.formSettings.gap}
            onChange={(e) =>
              onUpdateFormSettings({ gap: e.target.value as SpacingToken })
            }
            className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="xs">Extra Small</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>

        {/* Cross-Field Rules */}
        <div className="border-t border-border pt-3">
          <h4 className="text-sm font-medium mb-2">Cross-Field Rules</h4>
          <CrossFieldRuleBuilder
            rules={builderState.crossFieldRules}
            allFields={builderState.fields}
            onAdd={onAddCrossFieldRule}
            onUpdate={onUpdateCrossFieldRule}
            onRemove={onRemoveCrossFieldRule}
          />
        </div>
      </div>
    </div>
  );
}
