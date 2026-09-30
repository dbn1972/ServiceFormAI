/**
 * Camera Component Registration
 *
 * Registers CameraPhotoCapture and CameraDocumentCapture as premium
 * platform components under the __platform__ tenant scope, and registers
 * their associated custom validators.
 *
 * Called from the premium component loader during app initialization.
 */

import { componentRegistry, PLATFORM_TENANT } from '../../services/componentRegistry';
import { customValidatorRegistry } from '@serviceformai/form-engine-core';
import type { ComponentManifest } from '../../types/customComponent';
import CameraPhotoCapture from './CameraPhotoCapture';
import CameraDocumentCapture from './CameraDocumentCapture';
import { cameraPhotoValidator, cameraDocumentValidator } from './validators';
import { DEFAULT_PHOTO_CONFIG, DEFAULT_DOCUMENT_CONFIG } from './types';

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

const CAMERA_PHOTO_MANIFEST: ComponentManifest = {
  fieldType: 'camera_photo',
  displayName: 'Camera Photo Capture',
  version: '1.0.0',
  description: 'Passport-style photo capture with face guide overlay and optional liveness detection',
  validators: [
    {
      name: 'camera_photo_validator',
      description: 'Validates CaptureResult has valid base64 JPEG, dimensions, and file size',
    },
  ],
  defaultConfig: DEFAULT_PHOTO_CONFIG as unknown as Record<string, unknown>,
};

const CAMERA_DOCUMENT_MANIFEST: ComponentManifest = {
  fieldType: 'camera_document',
  displayName: 'Camera Document Capture',
  version: '1.0.0',
  description: 'Document scanning with edge detection, perspective correction, and multi-image capture',
  validators: [
    {
      name: 'camera_document_validator',
      description: 'Validates CaptureResult(s) with valid base64 JPEG, dimensions, file size, and image count',
    },
  ],
  defaultConfig: DEFAULT_DOCUMENT_CONFIG as unknown as Record<string, unknown>,
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

let registered = false;

/**
 * Register camera capture components and their validators.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function registerCameraComponents(): void {
  if (registered) return;

  // Register components in the ComponentRegistry under __platform__
  componentRegistry.register(PLATFORM_TENANT, CAMERA_PHOTO_MANIFEST, CameraPhotoCapture);
  componentRegistry.register(PLATFORM_TENANT, CAMERA_DOCUMENT_MANIFEST, CameraDocumentCapture);

  // Register custom validators in the CustomValidatorRegistry
  customValidatorRegistry.register('camera_photo_validator', cameraPhotoValidator as any);
  customValidatorRegistry.register('camera_document_validator', cameraDocumentValidator as any);

  registered = true;
}

/**
 * Reset the registered state (for testing purposes only).
 */
export function resetCameraRegistration(): void {
  registered = false;
}
