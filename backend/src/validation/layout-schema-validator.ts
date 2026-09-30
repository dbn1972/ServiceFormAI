/**
 * Layout Schema Validator (Backend)
 *
 * Validates the layout-related portions of a form schema.
 * This is a backend-compatible version that works with plain objects
 * (no React/frontend dependencies).
 *
 * Collects all errors without short-circuiting so admins can fix
 * all issues in one pass.
 */

interface LayoutValidationError {
  errorCode: string;
  message: string;
  path?: string;
}

interface LayoutValidationResult {
  valid: boolean;
  errors: LayoutValidationError[];
}

const VALID_SPACING_TOKENS = new Set(['xs', 'sm', 'md', 'lg', 'xl']);
const VALID_BREAKPOINT_KEYS = new Set(['mobile', 'tablet', 'desktop']);
const CSS_LENGTH_PATTERN = /^\d+(\.\d+)?(px|rem|em|%|vh|vw|ch|ex|cm|mm|in|pt|pc)$/;

function isIntegerInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isValidCssLength(value: string): boolean {
  return CSS_LENGTH_PATTERN.test(value);
}

/**
 * Validates the layout-related portions of a form schema object.
 * If no layout configuration is present, returns valid: true.
 */
export function validateLayoutSchema(schema: any): LayoutValidationResult {
  const errors: LayoutValidationError[] = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  const fields: any[] = Array.isArray(schema.fields) ? schema.fields : [];
  const fieldIdSet = new Set(fields.map((f: any) => f?.id).filter(Boolean));

  // Validate layout.columns
  if (schema.layout) {
    if (!isIntegerInRange(schema.layout.columns, 1, 4)) {
      errors.push({
        errorCode: 'SCHEMA_INVALID_COLUMNS',
        message: `layout.columns must be an integer between 1 and 4, got ${JSON.stringify(schema.layout.columns)}`,
        path: 'layout.columns',
      });
    }

    // Validate gap
    if (schema.layout.gap !== undefined) {
      const gap = schema.layout.gap;
      if (typeof gap === 'string') {
        if (!VALID_SPACING_TOKENS.has(gap) && !isValidCssLength(gap)) {
          errors.push({
            errorCode: 'SCHEMA_INVALID_GAP',
            message: `layout.gap must be a valid spacing token or CSS length, got "${gap}"`,
            path: 'layout.gap',
          });
        }
      } else {
        errors.push({
          errorCode: 'SCHEMA_INVALID_GAP',
          message: `layout.gap must be a string, got ${typeof gap}`,
          path: 'layout.gap',
        });
      }
    }

    // Validate responsive breakpoints
    if (schema.layout.responsive) {
      const responsive = schema.layout.responsive;
      for (const [key, value] of Object.entries(responsive)) {
        if (!VALID_BREAKPOINT_KEYS.has(key)) {
          errors.push({
            errorCode: 'SCHEMA_INVALID_RESPONSIVE_BREAKPOINT',
            message: `responsive key must be one of mobile, tablet, desktop, got "${key}"`,
            path: `layout.responsive.${key}`,
          });
        } else if (!isIntegerInRange(value, 1, 4)) {
          errors.push({
            errorCode: 'SCHEMA_INVALID_RESPONSIVE_BREAKPOINT',
            message: `responsive.${key} must be an integer between 1 and 4, got ${JSON.stringify(value)}`,
            path: `layout.responsive.${key}`,
          });
        }
      }
    }
  }

  // Validate per-field colSpan and conditionalStyles
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue;

    if (field.colSpan !== undefined) {
      if (!isIntegerInRange(field.colSpan, 1, 4)) {
        errors.push({
          errorCode: 'SCHEMA_INVALID_COLSPAN',
          message: `Field "${field.id}" colSpan must be a positive integer not exceeding 4, got ${JSON.stringify(field.colSpan)}`,
          path: `fields.${field.id}.colSpan`,
        });
      }
    }

    if (Array.isArray(field.conditionalStyles)) {
      for (const rule of field.conditionalStyles) {
        if (rule && typeof rule === 'object' && rule.field && !fieldIdSet.has(rule.field)) {
          errors.push({
            errorCode: 'SCHEMA_INVALID_CONDITIONAL_STYLE_REF',
            message: `Field "${field.id}" conditionalStyles references non-existent field "${rule.field}"`,
            path: `fields.${field.id}.conditionalStyles`,
          });
        }
      }
    }
  }

  // Validate sections
  if (Array.isArray(schema.sections)) {
    const sectionIdSet = new Set<string>();

    for (const section of schema.sections) {
      if (!section || typeof section !== 'object') continue;

      if (sectionIdSet.has(section.id)) {
        errors.push({
          errorCode: 'SCHEMA_DUPLICATE_SECTION_ID',
          message: `Duplicate section ID: "${section.id}"`,
          path: `sections.${section.id}`,
        });
      }
      sectionIdSet.add(section.id);

      if (Array.isArray(section.fieldIds)) {
        for (const fieldId of section.fieldIds) {
          if (!fieldIdSet.has(fieldId)) {
            errors.push({
              errorCode: 'SCHEMA_SECTION_FIELD_NOT_FOUND',
              message: `Section "${section.id}" references non-existent field "${fieldId}"`,
              path: `sections.${section.id}.fieldIds`,
            });
          }
        }
      }

      // Validate per-section layout
      if (section.layout) {
        if (!isIntegerInRange(section.layout.columns, 1, 4)) {
          errors.push({
            errorCode: 'SCHEMA_INVALID_COLUMNS',
            message: `Section "${section.id}" layout.columns must be an integer between 1 and 4, got ${JSON.stringify(section.layout.columns)}`,
            path: `sections.${section.id}.layout.columns`,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
