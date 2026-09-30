/**
 * ConditionalLogicBuilder — Visual conditional visibility configuration.
 *
 * Displays controlling field dropdown, operator dropdown, and type-appropriate
 * value input. Warns on chained conditions and broken references.
 */

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { BuilderField, BuilderConditionalClause } from './types';

interface ConditionalLogicBuilderProps {
  field: BuilderField;
  allFields: BuilderField[];
  onUpdate: (conditional: BuilderConditionalClause | null) => void;
}

const OPERATORS: { value: BuilderConditionalClause['operator']; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
];

export default function ConditionalLogicBuilder({
  field,
  allFields,
  onUpdate,
}: ConditionalLogicBuilderProps) {
  const conditional = field.conditional;

  // Available controlling fields (exclude self)
  const availableFields = useMemo(
    () => allFields.filter((f) => f.id !== field.id),
    [allFields, field.id]
  );

  // Find the controlling field
  const controllingField = useMemo(
    () => availableFields.find((f) => f.id === conditional?.field),
    [availableFields, conditional?.field]
  );

  // Check for broken reference
  const isBrokenRef =
    conditional?.field && !allFields.some((f) => f.id === conditional.field);

  // Check for chained condition (controlling field is itself conditional)
  const isChained = controllingField?.conditional != null;

  const handleFieldChange = (fieldId: string) => {
    if (!fieldId) {
      onUpdate(null);
      return;
    }
    onUpdate({
      field: fieldId,
      operator: conditional?.operator || 'equals',
      value: conditional?.value ?? '',
    });
  };

  const handleOperatorChange = (operator: BuilderConditionalClause['operator']) => {
    if (!conditional) return;
    onUpdate({ ...conditional, operator });
  };

  const handleValueChange = (value: string | number) => {
    if (!conditional) return;
    onUpdate({ ...conditional, value });
  };

  return (
    <div className="space-y-3">
      {/* Controlling field */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Show this field when
        </label>
        <select
          value={conditional?.field || ''}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Controlling field"
        >
          <option value="">Always visible</option>
          {availableFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label} ({f.type})
            </option>
          ))}
        </select>
      </div>

      {conditional && (
        <>
          {/* Operator */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Operator
            </label>
            <select
              value={conditional.operator}
              onChange={(e) =>
                handleOperatorChange(e.target.value as BuilderConditionalClause['operator'])
              }
              className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Comparison operator"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value input — type-appropriate */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Value
            </label>
            {controllingField?.type === 'dropdown' || controllingField?.type === 'radio' ? (
              <select
                value={String(conditional.value)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Condition value"
              >
                <option value="">Select value</option>
                {controllingField.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : controllingField?.type === 'number' ? (
              <input
                type="number"
                value={conditional.value}
                onChange={(e) =>
                  handleValueChange(
                    e.target.value ? parseFloat(e.target.value) : ''
                  )
                }
                className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Condition value"
              />
            ) : (
              <input
                type="text"
                value={String(conditional.value)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Condition value"
              />
            )}
          </div>

          {/* Warnings */}
          {isBrokenRef && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded text-sm text-destructive" role="alert">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Broken reference: the controlling field "{conditional.field}" no longer exists.
              </span>
            </div>
          )}

          {isChained && (
            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded text-sm text-yellow-700" role="alert">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Chained condition: the controlling field is itself conditional, which may produce complex behaviour.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
