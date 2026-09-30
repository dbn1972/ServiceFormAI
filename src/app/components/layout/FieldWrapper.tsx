/**
 * FieldWrapper
 *
 * Wraps each form field with style overrides and conditional styling.
 * Applies colSpan, className, themeTokens, inlineStyle, and conditional
 * styles in the correct precedence order.
 */

import { useMemo, type ReactNode, type CSSProperties } from 'react';
import type { ExtendedFormField } from '../../types/layoutTypes';
import { evaluateConditionalStyles } from '../../utils/conditionalStyleEvaluator';

interface FieldWrapperProps {
  field: ExtendedFormField;
  formData: Record<string, unknown>;
  /** Set of all field IDs in the schema (for conditional style validation). */
  schemaFieldIds: Set<string>;
  /** Current grid column count (for colSpan clamping). */
  columns: number;
  children: ReactNode;
}

/**
 * Resolves themeTokens to CSS variable references.
 * Maps { borderColor: "primary" } → { borderColor: "var(--tenant-primary)" }
 */
function resolveThemeTokens(
  themeTokens: Record<string, string> | undefined,
): CSSProperties {
  if (!themeTokens) return {};
  const resolved: Record<string, string> = {};
  for (const [cssProp, tokenKey] of Object.entries(themeTokens)) {
    resolved[cssProp] = `var(--tenant-${tokenKey})`;
  }
  return resolved as unknown as CSSProperties;
}

export default function FieldWrapper({
  field,
  formData,
  schemaFieldIds,
  columns,
  children,
}: FieldWrapperProps) {
  // Clamp colSpan to the current column count
  const effectiveColSpan = Math.min(field.colSpan ?? 1, columns);

  // Evaluate conditional styles
  const conditionalResult = useMemo(() => {
    if (!field.conditionalStyles || field.conditionalStyles.length === 0) {
      return { classNames: '', inlineStyle: {} as CSSProperties };
    }
    return evaluateConditionalStyles(field.conditionalStyles, formData, schemaFieldIds);
  }, [field.conditionalStyles, formData, schemaFieldIds]);

  // Build the merged inline style in precedence order:
  // 1. themeTokens (lowest)
  // 2. conditional styles
  // 3. inlineStyle (highest)
  const mergedStyle = useMemo<CSSProperties>(() => {
    const style: CSSProperties = {
      gridColumn: `span ${effectiveColSpan}`,
    };

    // Theme token styles
    if (field.style?.themeTokens) {
      Object.assign(style, resolveThemeTokens(field.style.themeTokens));
    }

    // Conditional styles
    if (conditionalResult.inlineStyle) {
      Object.assign(style, conditionalResult.inlineStyle);
    }

    // Inline styles (highest specificity)
    if (field.style?.inlineStyle) {
      Object.assign(style, field.style.inlineStyle);
    }

    return style;
  }, [effectiveColSpan, field.style, conditionalResult.inlineStyle]);

  // Build class names
  const className = useMemo(() => {
    const classes: string[] = ['field-wrapper'];
    if (field.style?.className) {
      classes.push(field.style.className);
    }
    if (conditionalResult.classNames) {
      classes.push(conditionalResult.classNames);
    }
    return classes.join(' ');
  }, [field.style?.className, conditionalResult.classNames]);

  return (
    <div
      className={className}
      style={mergedStyle}
      data-field-id={field.id}
      data-testid={`field-wrapper-${field.id}`}
    >
      {children}
    </div>
  );
}
