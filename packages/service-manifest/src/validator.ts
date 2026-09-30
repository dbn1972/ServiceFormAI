import type {
  ServiceManifest,
  ServiceManifestValidationError,
  ServiceManifestValidationResult,
} from './types.js';

function pushError(errors: ServiceManifestValidationError[], path: string, message: string) {
  errors.push({ path, message });
}

export function validateServiceManifest(manifest: ServiceManifest): ServiceManifestValidationResult {
  const errors: ServiceManifestValidationError[] = [];

  if (!manifest.manifestVersion) {
    pushError(errors, 'manifestVersion', 'Manifest version is required.');
  }

  if (!manifest.serviceType) {
    pushError(errors, 'serviceType', 'Service type is required.');
  }

  if (!manifest.service?.id) {
    pushError(errors, 'service.id', 'Service ID is required.');
  }

  if (!manifest.service?.name) {
    pushError(errors, 'service.name', 'Service name is required.');
  }

  if (!manifest.service?.category) {
    pushError(errors, 'service.category', 'Service category is required.');
  }

  if (!manifest.service?.description) {
    pushError(errors, 'service.description', 'Service description is required.');
  }

  if (!manifest.service?.formSchema?.title) {
    pushError(errors, 'service.formSchema.title', 'Form schema title is required.');
  }

  if (!Array.isArray(manifest.service?.formSchema?.fields) || manifest.service.formSchema.fields.length === 0) {
    pushError(errors, 'service.formSchema.fields', 'At least one form field is required.');
  }

  manifest.service?.formSchema?.fields?.forEach((field, index) => {
    if (!field.id) {
      pushError(errors, `service.formSchema.fields[${index}].id`, 'Field ID is required.');
    }

    if (!field.name) {
      pushError(errors, `service.formSchema.fields[${index}].name`, 'Field name is required.');
    }

    if (!field.type) {
      pushError(errors, `service.formSchema.fields[${index}].type`, 'Field type is required.');
    }

    if (!field.label) {
      pushError(errors, `service.formSchema.fields[${index}].label`, 'Field label is required.');
    }
  });

  if (!Array.isArray(manifest.workflow?.stages) || manifest.workflow?.stages.length === 0) {
    pushError(errors, 'workflow.stages', 'At least one workflow stage is required.');
  }

  manifest.workflow?.stages?.forEach((stage, index) => {
    if (!stage.id) {
      pushError(errors, `workflow.stages[${index}].id`, 'Stage ID is required.');
    }

    if (!stage.name) {
      pushError(errors, `workflow.stages[${index}].name`, 'Stage name is required.');
    }

    if (!stage.assignedRole) {
      pushError(errors, `workflow.stages[${index}].assignedRole`, 'Assigned role is required.');
    }
  });

  if (!manifest.localization?.defaultLanguage) {
    pushError(errors, 'localization.defaultLanguage', 'Default language is required.');
  }

  if (!Array.isArray(manifest.localization?.supportedLanguages) || manifest.localization.supportedLanguages.length === 0) {
    pushError(errors, 'localization.supportedLanguages', 'At least one supported language is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}