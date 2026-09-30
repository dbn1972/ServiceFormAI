# Migration Guide: DynamicFormRenderer → useFormEngine

This guide explains how to incrementally migrate from the monolithic `DynamicFormRenderer` component to the composable `useFormEngine` hook-based API.

## Overview

The `DynamicFormRenderer` component has been refactored internally to use `useFormEngine`. It continues to work with the same props interface — no changes are required to existing call sites. This guide is for teams that want to adopt the new composable API for greater flexibility.

## Backward Compatibility

The existing `DynamicFormRenderer` continues to work during migration:

```tsx
// This still works — no changes needed
<DynamicFormRenderer
  schema={serviceFormSchema}
  onSubmit={handleSubmit}
  onValidate={handleValidate}
/>
```

Internally, it now delegates to `useFormEngine`. You can migrate individual forms at your own pace.

## Step-by-Step Migration

### Step 1: Install the packages

Both packages are already in the workspace. If using them externally:

```bash
npm install @serviceformai/form-engine-react
# @serviceformai/form-engine-core is installed automatically as a dependency
```

### Step 2: Replace DynamicFormRenderer with useFormEngine

**Before (DynamicFormRenderer):**

```tsx
import DynamicFormRenderer from './components/DynamicFormRenderer';

function MyPage() {
  return (
    <DynamicFormRenderer
      schema={serviceFormSchema}
      onSubmit={handleSubmit}
    />
  );
}
```

**After (useFormEngine + FormProvider + FormField):**

```tsx
import {
  useFormEngine,
  FormProvider,
  FormField,
} from '@serviceformai/form-engine-react';

function MyForm({ schema }: { schema: FormSchema }) {
  const engine = useFormEngine(schema);

  return (
    <FormProvider engine={engine}>
      <form onSubmit={(e) => {
        e.preventDefault();
        engine.handleSubmit(async (data) => {
          await submitToApi(data);
        });
      }}>
        {engine.visibleFields.map((field) => (
          <FormField key={field.id} fieldId={field.id} />
        ))}
        <button type="submit" disabled={engine.submitting}>
          Submit
        </button>
      </form>
    </FormProvider>
  );
}
```

### Step 3: Create a Custom UI Adapter (Optional)

The default adapter uses plain HTML elements. To use your existing Tailwind/Radix components:

```tsx
import { createAdapter } from '@serviceformai/form-engine-react';
import type { UIAdapterProps } from '@serviceformai/form-engine-react';

function TailwindTextInput(props: UIAdapterProps) {
  const hasError = props.touched && props.error;
  return (
    <div className="mb-6">
      <label htmlFor={props.field.id} className="block text-sm font-medium mb-2">
        {props.field.label}
      </label>
      <input
        id={props.field.id}
        type="text"
        value={props.value ?? ''}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        disabled={props.disabled}
        className={`w-full px-4 py-3 border rounded-lg ${
          hasError ? 'border-destructive' : 'border-border'
        }`}
      />
      {hasError && <p className="text-destructive text-sm mt-1">{props.error}</p>}
    </div>
  );
}

const tailwindAdapter = createAdapter({
  text: TailwindTextInput,
  // Override only the types you need — others fall back to defaultAdapter
});

// Use it:
<FormProvider engine={engine} ui={tailwindAdapter}>
  ...
</FormProvider>
```

## Props Mapping

| DynamicFormRenderer Prop | useFormEngine Equivalent |
|---|---|
| `schema` | `useFormEngine(toEngineSchema(schema))` |
| `onSubmit` | `engine.handleSubmit(onSubmit)` |
| `onValidate` | Run after `engine.handleSubmit` validates; use `engine.setServerErrors` for custom errors |
| Form data access | `engine.values` |
| Error display | `engine.errors[fieldId]` |
| Touched state | `engine.touched[fieldId]` |
| Submitting state | `engine.submitting` |
| Server errors (422) | `engine.setServerErrors(errors)` |

## Multi-Step Forms

```tsx
const engine = useFormEngine(schemaWithSteps);

// Navigate
engine.nextStep();    // validates current step first
engine.prevStep();    // no validation
engine.goToStep('step-2'); // validates current step first

// Read state
engine.currentStepId  // current step ID
engine.steps          // array of FormStep objects
```

## Breaking Changes

There are no breaking changes when using `DynamicFormRenderer` — it continues to work identically.

When migrating to `useFormEngine`:

1. **Schema format**: `useFormEngine` expects a `FormSchema` (from the core package), not a `ServiceFormSchema`. Use the `toEngineSchema()` conversion function if needed.
2. **Error format**: `engine.errors` is `Record<string, string>` (first error message per field), not `Record<string, ValidationError[]>`.
3. **Visibility**: Use `engine.visibleFields` array instead of manually checking conditional clauses.
4. **No built-in toast notifications**: The hook doesn't show toasts — that's your UI's responsibility.
5. **No built-in scroll-to-error**: Implement this in your submit handler if needed.
