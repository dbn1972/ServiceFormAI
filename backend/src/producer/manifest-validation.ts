export interface BackendManifestValidationError {
  path: string;
  message: string;
}

export interface BackendManifestValidationResult {
  valid: boolean;
  errors: BackendManifestValidationError[];
}

export function validateBackendServiceManifest(manifest: any): BackendManifestValidationResult {
  const errors: BackendManifestValidationError[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return {
      valid: false,
      errors: [{ path: 'manifest', message: 'Manifest must be an object.' }],
    };
  }

  if (!manifest.manifestVersion) {
    errors.push({ path: 'manifestVersion', message: 'Manifest version is required.' });
  }

  if (!manifest.serviceType) {
    errors.push({ path: 'serviceType', message: 'Service type is required.' });
  }

  if (!manifest.service || typeof manifest.service !== 'object') {
    errors.push({ path: 'service', message: 'Service block is required.' });
  } else {
    if (!manifest.service.id) {
      errors.push({ path: 'service.id', message: 'Service ID is required.' });
    }

    if (!manifest.service.name) {
      errors.push({ path: 'service.name', message: 'Service name is required.' });
    }

    if (!manifest.service.category) {
      errors.push({ path: 'service.category', message: 'Service category is required.' });
    }

    if (!manifest.service.description) {
      errors.push({ path: 'service.description', message: 'Service description is required.' });
    }

    if (!manifest.service.formSchema || typeof manifest.service.formSchema !== 'object') {
      errors.push({ path: 'service.formSchema', message: 'Form schema is required.' });
    } else {
      if (!manifest.service.formSchema.title) {
        errors.push({ path: 'service.formSchema.title', message: 'Form schema title is required.' });
      }

      if (!Array.isArray(manifest.service.formSchema.fields) || manifest.service.formSchema.fields.length === 0) {
        errors.push({ path: 'service.formSchema.fields', message: 'At least one form field is required.' });
      }
    }
  }

  if (!manifest.workflow || !Array.isArray(manifest.workflow.stages) || manifest.workflow.stages.length === 0) {
    errors.push({ path: 'workflow.stages', message: 'At least one workflow stage is required.' });
  }

  if (!manifest.localization || !manifest.localization.defaultLanguage) {
    errors.push({ path: 'localization.defaultLanguage', message: 'Default language is required.' });
  }

  if (!manifest.localization || !Array.isArray(manifest.localization.supportedLanguages) || manifest.localization.supportedLanguages.length === 0) {
    errors.push({ path: 'localization.supportedLanguages', message: 'At least one supported language is required.' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}