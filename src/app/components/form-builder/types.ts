/**
 * Visual Form Builder — Type Definitions
 *
 * Central type definitions for the drag-and-drop form builder.
 * These types define the BuilderState data model, actions for the
 * reducer, history management, and template structures.
 */

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ---------------------------------------------------------------------------
// Field Types
// ---------------------------------------------------------------------------

export type BuiltInFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'textarea';

export const BUILT_IN_FIELD_TYPES: BuiltInFieldType[] = [
  'text',
  'number',
  'email',
  'phone',
  'date',
  'dropdown',
  'radio',
  'checkbox',
  'file',
  'textarea',
];

// ---------------------------------------------------------------------------
// Validator Types (Indian document validators)
// ---------------------------------------------------------------------------

export type ValidatorType =
  | 'aadhaar'
  | 'pan'
  | 'mobile_in'
  | 'ifsc'
  | 'pincode_in'
  | 'email'
  | 'bank_account_in';

// ---------------------------------------------------------------------------
// Field Option (for dropdown/radio)
// ---------------------------------------------------------------------------

export interface FieldOption {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// BuilderFieldValidation
// ---------------------------------------------------------------------------

export interface BuilderFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
  message?: string;
}

// ---------------------------------------------------------------------------
// BuilderConditionalClause
// ---------------------------------------------------------------------------

export interface BuilderConditionalClause {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

// ---------------------------------------------------------------------------
// BuilderField
// ---------------------------------------------------------------------------

export interface BuilderField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: BuilderFieldValidation;
  validatorType?: ValidatorType;
  options?: FieldOption[];
  conditional?: BuilderConditionalClause;
  colSpan?: number;
  customConfig?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// BuilderSection
// ---------------------------------------------------------------------------

export interface BuilderSection {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  fieldIds: string[];
}

// ---------------------------------------------------------------------------
// BuilderCrossFieldRule
// ---------------------------------------------------------------------------

export interface BuilderCrossFieldRule {
  type: 'date_after' | 'required_if' | 'sum_equals' | 'mutually_exclusive' | 'match';
  fields: string[];
  targetField?: string;
  targetValue?: any;
  message?: string;
}

// ---------------------------------------------------------------------------
// BuilderMetadata
// ---------------------------------------------------------------------------

export interface BuilderMetadata {
  serviceId?: string;
  serviceName: string;
  description: string;
  category: string;
  department?: string;
  slaDays?: number;
}

// ---------------------------------------------------------------------------
// FormSettings
// ---------------------------------------------------------------------------

export interface FormSettings {
  columns: number;  // 1–4, default 1
  gap: SpacingToken; // default 'md'
}

// ---------------------------------------------------------------------------
// BuilderState — the central data model
// ---------------------------------------------------------------------------

export interface BuilderState {
  metadata: BuilderMetadata;
  fields: BuilderField[];
  sections: BuilderSection[];
  formSettings: FormSettings;
  crossFieldRules: BuilderCrossFieldRule[];
}

// ---------------------------------------------------------------------------
// BuilderAction — discriminated union for the reducer
// ---------------------------------------------------------------------------

export type BuilderAction =
  | { type: 'UPDATE_METADATA'; updates: Partial<BuilderMetadata> }
  | { type: 'ADD_FIELD'; fieldType: string; index: number }
  | { type: 'REMOVE_FIELD'; fieldId: string }
  | { type: 'REORDER_FIELD'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_FIELD'; fieldId: string; updates: Partial<BuilderField> }
  | { type: 'UPDATE_FORM_SETTINGS'; updates: Partial<FormSettings> }
  | { type: 'ADD_CROSS_FIELD_RULE'; rule: BuilderCrossFieldRule }
  | { type: 'UPDATE_CROSS_FIELD_RULE'; index: number; rule: BuilderCrossFieldRule }
  | { type: 'REMOVE_CROSS_FIELD_RULE'; index: number }
  | { type: 'ADD_SECTION'; section: BuilderSection }
  | { type: 'UPDATE_SECTION'; sectionId: string; updates: Partial<BuilderSection> }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'LOAD_STATE'; state: BuilderState }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ---------------------------------------------------------------------------
// HistoryState
// ---------------------------------------------------------------------------

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// ---------------------------------------------------------------------------
// ImportError / ParseError
// ---------------------------------------------------------------------------

export interface ImportError {
  error: true;
  message: string;
}

export interface ParseError {
  error: true;
  message: string;
}

// ---------------------------------------------------------------------------
// FormTemplate
// ---------------------------------------------------------------------------

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fieldSummary: string[];
  state: BuilderState;
}

// ---------------------------------------------------------------------------
// BrokenReference (for reference validator)
// ---------------------------------------------------------------------------

export interface BrokenReference {
  type: 'conditional' | 'cross-field';
  fieldId: string;
  referencedFieldId: string;
  context: string;
}

// ---------------------------------------------------------------------------
// DnD item types
// ---------------------------------------------------------------------------

export const DND_ITEM_TYPES = {
  FIELD_TYPE: 'FIELD_TYPE',
  CANVAS_FIELD: 'CANVAS_FIELD',
} as const;

export interface DragFieldTypeItem {
  type: typeof DND_ITEM_TYPES.FIELD_TYPE;
  fieldType: string;
}

export interface DragCanvasFieldItem {
  type: typeof DND_ITEM_TYPES.CANVAS_FIELD;
  fieldId: string;
  index: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a blank BuilderState */
export function createBlankBuilderState(serviceId?: string): BuilderState {
  return {
    metadata: {
      serviceId,
      serviceName: '',
      description: '',
      category: '',
      department: '',
      slaDays: 30,
    },
    fields: [],
    sections: [],
    formSettings: {
      columns: 1,
      gap: 'md',
    },
    crossFieldRules: [],
  };
}

/** Generate a unique field ID */
export function generateFieldId(): string {
  return `field_${Math.random().toString(36).substring(2, 9)}`;
}

/** Create a default BuilderField for a given type */
export function createDefaultField(fieldType: string): BuilderField {
  const id = generateFieldId();
  const base: BuilderField = {
    id,
    type: fieldType,
    label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
    required: false,
  };

  // Add type-specific defaults
  switch (fieldType) {
    case 'dropdown':
    case 'radio':
      base.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      break;
    case 'textarea':
      base.placeholder = 'Enter text...';
      break;
    case 'email':
      base.placeholder = 'email@example.com';
      break;
    case 'phone':
      base.placeholder = '+91 XXXXX XXXXX';
      break;
    default:
      break;
  }

  return base;
}
