/**
 * LayoutEngine
 *
 * Core component that reads LayoutConfig from the schema and renders
 * fields in a CSS Grid. Supports responsive breakpoints, sections,
 * RTL, and conditional field visibility.
 *
 * Breakpoint strategy (using Tailwind responsive prefixes):
 * - Mobile (<640px): 1 column (default)
 * - Tablet (640–1023px): max 2 columns (sm: prefix)
 * - Desktop (≥1024px): full column count (lg: prefix)
 *
 * Custom responsive overrides from the schema take precedence.
 */

import { useMemo, type ReactNode } from 'react';
import type {
  ExtendedFormSchema,
  ExtendedFormField,
  FormSection,
  LayoutConfig,
  SpacingToken,
} from '../../types/layoutTypes';
import { SPACING_SCALE_DEFAULTS } from '../../types/layoutTypes';
import SectionGroup from './SectionGroup';
import FieldWrapper from './FieldWrapper';

interface LayoutEngineProps {
  schema: ExtendedFormSchema;
  formData: Record<string, unknown>;
  renderField: (field: ExtendedFormField) => ReactNode;
  direction?: 'ltr' | 'rtl';
  /** Language code for screen reader pronunciation (e.g., 'ar', 'he'). */
  lang?: string;
}

/**
 * Resolves a gap value — either a spacing token or a raw CSS length.
 */
function resolveGap(gap?: string | SpacingToken): string {
  if (!gap) return SPACING_SCALE_DEFAULTS.md; // default 1rem
  if (gap in SPACING_SCALE_DEFAULTS) {
    return SPACING_SCALE_DEFAULTS[gap as SpacingToken];
  }
  return gap;
}

/**
 * Checks if a field should be visible based on its conditional clause.
 */
function isFieldVisible(field: ExtendedFormField, formData: Record<string, unknown>): boolean {
  if (!field.conditional) return true;

  const { field: refField, operator, value } = field.conditional;
  const fieldValue = formData[refField];

  switch (operator) {
    case 'equals':
      // eslint-disable-next-line eqeqeq
      return fieldValue == value;
    case 'not_equals':
      // eslint-disable-next-line eqeqeq
      return fieldValue != value;
    case 'contains':
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return fieldValue.includes(value);
      }
      return false;
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    default:
      return true;
  }
}

/**
 * Tailwind grid column classes for each column count (1–4).
 * Uses responsive prefixes for breakpoint-based clamping.
 */
function getGridClasses(layout: LayoutConfig): string {
  const responsive = layout.responsive;
  const cols = layout.columns;

  if (responsive) {
    // Custom responsive overrides
    const mobileCols = responsive.mobile ?? 1;
    const tabletCols = responsive.tablet ?? Math.min(cols, 2);
    const desktopCols = responsive.desktop ?? cols;

    return [
      `grid`,
      `grid-cols-${mobileCols}`,
      `sm:grid-cols-${tabletCols}`,
      `lg:grid-cols-${desktopCols}`,
    ].join(' ');
  }

  // Default responsive clamping
  const tabletCols = Math.min(cols, 2);

  return [
    `grid`,
    `grid-cols-1`,
    `sm:grid-cols-${tabletCols}`,
    `lg:grid-cols-${cols}`,
  ].join(' ');
}

/**
 * Gets the effective column count for a section or the root layout.
 */
function getEffectiveColumns(
  sectionLayout?: LayoutConfig,
  rootLayout?: LayoutConfig,
): number {
  return sectionLayout?.columns ?? rootLayout?.columns ?? 1;
}

export default function LayoutEngine({
  schema,
  formData,
  renderField,
  direction = 'ltr',
  lang,
}: LayoutEngineProps) {
  const layout = schema.layout;
  const fieldMap = useMemo(
    () => new Map(schema.fields.map((f) => [f.id, f])),
    [schema.fields],
  );
  const schemaFieldIds = useMemo(
    () => new Set(schema.fields.map((f) => f.id)),
    [schema.fields],
  );

  const resolvedGap = resolveGap(layout?.gap);

  // Determine which fields are assigned to sections
  const assignedFieldIds = useMemo(() => {
    const ids = new Set<string>();
    if (schema.sections) {
      for (const section of schema.sections) {
        for (const id of section.fieldIds) {
          ids.add(id);
        }
      }
    }
    return ids;
  }, [schema.sections]);

  // Fields not assigned to any section
  const unassignedFields = useMemo(
    () => schema.fields.filter((f) => !assignedFieldIds.has(f.id)),
    [schema.fields, assignedFieldIds],
  );

  const renderFieldsInGrid = (
    fields: ExtendedFormField[],
    columns: number,
  ) => {
    return fields
      .filter((field) => isFieldVisible(field, formData))
      .map((field) => (
        <FieldWrapper
          key={field.id}
          field={field}
          formData={formData}
          schemaFieldIds={schemaFieldIds}
          columns={columns}
        >
          {renderField(field)}
        </FieldWrapper>
      ));
  };

  const renderSection = (section: FormSection) => {
    const sectionFields = section.fieldIds
      .map((id) => fieldMap.get(id))
      .filter((f): f is ExtendedFormField => f !== undefined);

    const sectionColumns = getEffectiveColumns(section.layout, layout);
    const sectionGap = resolveGap(section.layout?.gap ?? layout?.gap);

    return (
      <SectionGroup
        key={section.id}
        section={section}
        columns={sectionColumns}
        gap={sectionGap}
        defaultCollapsed={section.defaultCollapsed}
      >
        {renderFieldsInGrid(sectionFields, sectionColumns)}
      </SectionGroup>
    );
  };

  const rootColumns = layout?.columns ?? 1;
  const gridClasses = layout ? getGridClasses(layout) : 'grid grid-cols-1';

  return (
    <div
      className="layout-engine"
      dir={direction}
      lang={lang}
      data-testid="layout-engine"
      style={{
        // Use CSS logical properties for RTL support
        paddingInlineStart: 0,
        paddingInlineEnd: 0,
      }}
    >
      {/* Unassigned fields rendered in an implicit default section */}
      {unassignedFields.length > 0 && (
        <div
          className={gridClasses}
          style={{ gap: resolvedGap }}
          data-testid="default-section"
        >
          {renderFieldsInGrid(unassignedFields, rootColumns)}
        </div>
      )}

      {/* Named sections */}
      {schema.sections?.map(renderSection)}
    </div>
  );
}
