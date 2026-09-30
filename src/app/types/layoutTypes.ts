/**
 * Layout and Theme Type Definitions
 *
 * Extended types for the dynamic CSS and responsive layout system.
 * These types extend the existing ServiceFormSchema and FormField
 * interfaces to support multi-column grid layouts, per-field style
 * overrides, section grouping, conditional styling, and tenant theming.
 */

import type { CSSProperties } from 'react';
import type { ServiceFormSchema, FormField } from './externalAPI';

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

/** Named spacing tokens used for gap values and spacing scales. */
export type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Default pixel/rem values for each spacing token. */
export const SPACING_SCALE_DEFAULTS: Record<SpacingToken, string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

// ---------------------------------------------------------------------------
// Layout Config
// ---------------------------------------------------------------------------

/** Layout configuration defining grid columns, gap, and responsive overrides. */
export interface LayoutConfig {
  /** Number of equal-width grid columns (1–4, required). */
  columns: number;
  /** Gap between grid cells — a SpacingToken or explicit CSS length. */
  gap?: string | SpacingToken;
  /** Per-breakpoint column count overrides. */
  responsive?: {
    /** Column count for viewports below 640px. */
    mobile?: number;
    /** Column count for viewports 640–1023px. */
    tablet?: number;
    /** Column count for viewports ≥1024px. */
    desktop?: number;
  };
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/** A named group of fields rendered with a header and optional collapsible behaviour. */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Field IDs belonging to this section. */
  fieldIds: string[];
  /** Per-section layout override. */
  layout?: LayoutConfig;
}

// ---------------------------------------------------------------------------
// Field Style Overrides
// ---------------------------------------------------------------------------

/** Per-field visual customisation. */
export interface FieldStyleOverride {
  /** Additional CSS class names applied to the field wrapper. */
  className?: string;
  /** Inline CSS styles applied to the field wrapper (highest specificity). */
  inlineStyle?: CSSProperties;
  /** Maps CSS property names to tenant theme token keys. */
  themeTokens?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Conditional Styling
// ---------------------------------------------------------------------------

/** A rule that applies styles when a referenced field meets a condition. */
export interface ConditionalStyleRule {
  /** Field ID to evaluate. */
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  /** CSS class names to apply when the condition is met. */
  className?: string;
  /** Inline styles to apply when the condition is met. */
  inlineStyle?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Extended Form Field
// ---------------------------------------------------------------------------

/** FormField extended with layout and styling properties. */
export interface ExtendedFormField extends FormField {
  /** Number of grid columns this field spans (1–4, defaults to 1). */
  colSpan?: number;
  /** Per-field style overrides. */
  style?: FieldStyleOverride;
  /** Conditional style rules evaluated against form data. */
  conditionalStyles?: ConditionalStyleRule[];
}

// ---------------------------------------------------------------------------
// Extended Form Schema
// ---------------------------------------------------------------------------

/** ServiceFormSchema extended with layout, sections, and styled fields. */
export interface ExtendedFormSchema extends Omit<ServiceFormSchema, 'fields'> {
  /** Grid layout configuration. */
  layout?: LayoutConfig;
  /** Section grouping definitions. */
  sections?: FormSection[];
  /** Fields with optional layout and styling extensions. */
  fields: ExtendedFormField[];
}

// ---------------------------------------------------------------------------
// Tenant Theme
// ---------------------------------------------------------------------------

/** Tenant-specific visual theme applied via CSS custom properties. */
export interface TenantTheme {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  borderRadius?: string | number;
  spacingScale?: Partial<Record<SpacingToken, string>>;
  borderColor?: string;
  backgroundColor?: string;
  direction?: 'ltr' | 'rtl';
  /** Logo URL for print header. */
  logoUrl?: string;
}

// ---------------------------------------------------------------------------
// CSS Variable Mapping
// ---------------------------------------------------------------------------

/** Maps TenantTheme token names to CSS custom property names and fallback values. */
export const THEME_CSS_VARIABLE_MAP: Record<string, { variable: string; fallback: string }> = {
  primaryColor: { variable: '--tenant-primaryColor', fallback: 'var(--primary)' },
  secondaryColor: { variable: '--tenant-secondaryColor', fallback: 'var(--secondary)' },
  fontFamily: { variable: '--tenant-fontFamily', fallback: 'inherit' },
  fontSize: { variable: '--tenant-fontSize', fallback: 'var(--font-size)' },
  borderRadius: { variable: '--tenant-borderRadius', fallback: 'var(--radius)' },
  borderColor: { variable: '--tenant-borderColor', fallback: 'var(--border)' },
  backgroundColor: { variable: '--tenant-backgroundColor', fallback: 'var(--background)' },
};

/** Maps spacing scale token names to CSS custom property names and fallback values. */
export const SPACING_CSS_VARIABLE_MAP: Record<SpacingToken, { variable: string; fallback: string }> = {
  xs: { variable: '--tenant-spacing-xs', fallback: '0.25rem' },
  sm: { variable: '--tenant-spacing-sm', fallback: '0.5rem' },
  md: { variable: '--tenant-spacing-md', fallback: '1rem' },
  lg: { variable: '--tenant-spacing-lg', fallback: '1.5rem' },
  xl: { variable: '--tenant-spacing-xl', fallback: '2rem' },
};

// ---------------------------------------------------------------------------
// Validation Results
// ---------------------------------------------------------------------------

/** Result of validating a layout schema. */
export interface LayoutValidationResult {
  valid: boolean;
  errors: LayoutValidationError[];
}

/** A single layout validation error. */
export interface LayoutValidationError {
  errorCode: string;
  message: string;
  path?: string;
}

/** Result of validating a tenant theme. */
export interface ThemeValidationResult {
  valid: boolean;
  errors: ThemeValidationError[];
}

/** A single theme validation error. */
export interface ThemeValidationError {
  token: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/** Error returned when parsing a LayoutConfig JSON string fails. */
export interface ParseError {
  error: true;
  message: string;
}
