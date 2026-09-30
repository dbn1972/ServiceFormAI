/**
 * CrossFieldRuleBuilder — Visual cross-field rule configuration.
 *
 * Displays in form-level settings when no field is selected.
 * Supports add, edit, and remove of cross-field rules with
 * type-appropriate field selectors and value inputs.
 */

import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import type { BuilderField, BuilderCrossFieldRule } from './types';

interface CrossFieldRuleBuilderProps {
  rules: BuilderCrossFieldRule[];
  allFields: BuilderField[];
  onAdd: (rule: BuilderCrossFieldRule) => void;
  onUpdate: (index: number, rule: BuilderCrossFieldRule) => void;
  onRemove: (index: number) => void;
}

const RULE_TYPES: { value: BuilderCrossFieldRule['type']; label: string; description: string }[] = [
  { value: 'date_after', label: 'Date After', description: 'End date must be after start date' },
  { value: 'required_if', label: 'Required If', description: 'Field required when another has a value' },
  { value: 'sum_equals', label: 'Sum Equals', description: 'Sum of fields must equal a target' },
  { value: 'mutually_exclusive', label: 'Mutually Exclusive', description: 'Only one field can have a value' },
  { value: 'match', label: 'Match', description: 'Two fields must have the same value' },
];

function RuleEditor({
  rule,
  allFields,
  onChange,
  onCancel,
}: {
  rule: BuilderCrossFieldRule;
  allFields: BuilderField[];
  onChange: (rule: BuilderCrossFieldRule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<BuilderCrossFieldRule>({ ...rule });

  const updateDraft = (updates: Partial<BuilderCrossFieldRule>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onChange(draft);
  };

  return (
    <div className="p-3 border border-border rounded-lg space-y-3 bg-accent/30">
      {/* Rule type */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Rule Type</label>
        <select
          value={draft.type}
          onChange={(e) =>
            updateDraft({ type: e.target.value as BuilderCrossFieldRule['type'], fields: [] })
          }
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Cross-field rule type"
        >
          {RULE_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Field selectors based on rule type */}
      {(draft.type === 'date_after' || draft.type === 'match') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Field 1</label>
            <select
              value={draft.fields[0] || ''}
              onChange={(e) =>
                updateDraft({ fields: [e.target.value, draft.fields[1] || ''] })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="First field"
            >
              <option value="">Select field</option>
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Field 2</label>
            <select
              value={draft.fields[1] || ''}
              onChange={(e) =>
                updateDraft({ fields: [draft.fields[0] || '', e.target.value] })
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Second field"
            >
              <option value="">Select field</option>
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {draft.type === 'required_if' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Trigger Field</label>
            <select
              value={draft.fields[0] || ''}
              onChange={(e) => updateDraft({ fields: [e.target.value] })}
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Trigger field"
            >
              <option value="">Select field</option>
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Target Field</label>
            <select
              value={draft.targetField || ''}
              onChange={(e) => updateDraft({ targetField: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Target field"
            >
              <option value="">Select field</option>
              {allFields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Trigger Value</label>
            <input
              type="text"
              value={draft.targetValue ?? ''}
              onChange={(e) => updateDraft({ targetValue: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Trigger value"
            />
          </div>
        </div>
      )}

      {(draft.type === 'sum_equals' || draft.type === 'mutually_exclusive') && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Fields</label>
          <select
            multiple
            value={draft.fields}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              updateDraft({ fields: selected });
            }}
            className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
            aria-label="Select fields"
          >
            {allFields.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          {draft.type === 'sum_equals' && (
            <div className="mt-2">
              <label className="text-xs text-muted-foreground block mb-1">Target Sum</label>
              <input
                type="number"
                value={draft.targetValue ?? ''}
                onChange={(e) =>
                  updateDraft({ targetValue: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Target sum value"
              />
            </div>
          )}
        </div>
      )}

      {/* Custom error message */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Error Message</label>
        <input
          type="text"
          value={draft.message || ''}
          onChange={(e) => updateDraft({ message: e.target.value || undefined })}
          placeholder="Custom error message"
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Custom error message"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm border border-border rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function CrossFieldRuleBuilder({
  rules,
  allFields,
  onAdd,
  onUpdate,
  onRemove,
}: CrossFieldRuleBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fieldIds = new Set(allFields.map((f) => f.id));

  const handleAdd = (rule: BuilderCrossFieldRule) => {
    onAdd(rule);
    setIsAdding(false);
  };

  const handleUpdate = (index: number, rule: BuilderCrossFieldRule) => {
    onUpdate(index, rule);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Existing rules */}
      {rules.map((rule, index) => {
        // Check for broken references
        const brokenFields = rule.fields.filter((id) => !fieldIds.has(id));
        const hasBrokenRef =
          brokenFields.length > 0 ||
          (rule.targetField && !fieldIds.has(rule.targetField));

        if (editingIndex === index) {
          return (
            <RuleEditor
              key={index}
              rule={rule}
              allFields={allFields}
              onChange={(r) => handleUpdate(index, r)}
              onCancel={() => setEditingIndex(null)}
            />
          );
        }

        const ruleType = RULE_TYPES.find((rt) => rt.value === rule.type);

        return (
          <div
            key={index}
            className={`flex items-start gap-2 p-2 rounded border ${
              hasBrokenRef ? 'border-destructive/50 bg-destructive/5' : 'border-border'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{ruleType?.label || rule.type}</div>
              <div className="text-xs text-muted-foreground truncate">
                Fields: {rule.fields.join(', ')}
                {rule.message && ` — ${rule.message}`}
              </div>
              {hasBrokenRef && (
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Broken field reference</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditingIndex(index)}
              className="p-1 rounded hover:bg-accent text-muted-foreground"
              aria-label={`Edit rule ${index + 1}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              aria-label={`Remove rule ${index + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add new rule */}
      {isAdding ? (
        <RuleEditor
          rule={{ type: 'date_after', fields: [] }}
          allFields={allFields}
          onChange={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
        >
          <Plus className="w-4 h-4" />
          Add Cross-Field Rule
        </button>
      )}
    </div>
  );
}
