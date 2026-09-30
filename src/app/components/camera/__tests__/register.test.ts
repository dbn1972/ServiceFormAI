/**
 * Unit tests for camera component registration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { componentRegistry, PLATFORM_TENANT } from '../../../services/componentRegistry';
import { customValidatorRegistry } from '@serviceformai/form-engine-core';
import { registerCameraComponents, resetCameraRegistration } from '../register';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registerCameraComponents', () => {
  beforeEach(() => {
    // Reset registration state so each test starts fresh
    resetCameraRegistration();

    // Remove any existing registrations
    componentRegistry.remove('camera_photo', PLATFORM_TENANT);
    componentRegistry.remove('camera_document', PLATFORM_TENANT);
    customValidatorRegistry.remove('camera_photo_validator');
    customValidatorRegistry.remove('camera_document_validator');
  });

  it('registers CameraPhotoCapture under __platform__:camera_photo', () => {
    registerCameraComponents();
    const reg = componentRegistry.getComponent('camera_photo', PLATFORM_TENANT);
    expect(reg).toBeDefined();
    expect(reg!.manifest.fieldType).toBe('camera_photo');
    expect(reg!.manifest.displayName).toBe('Camera Photo Capture');
    expect(reg!.manifest.version).toBe('1.0.0');
  });

  it('registers CameraDocumentCapture under __platform__:camera_document', () => {
    registerCameraComponents();
    const reg = componentRegistry.getComponent('camera_document', PLATFORM_TENANT);
    expect(reg).toBeDefined();
    expect(reg!.manifest.fieldType).toBe('camera_document');
    expect(reg!.manifest.displayName).toBe('Camera Document Capture');
  });

  it('registers camera_photo_validator in customValidatorRegistry', () => {
    registerCameraComponents();
    const validator = customValidatorRegistry.getValidator('camera_photo_validator');
    expect(validator).toBeDefined();
    expect(typeof validator).toBe('function');
  });

  it('registers camera_document_validator in customValidatorRegistry', () => {
    registerCameraComponents();
    const validator = customValidatorRegistry.getValidator('camera_document_validator');
    expect(validator).toBeDefined();
    expect(typeof validator).toBe('function');
  });

  it('componentRegistry.getComponent resolves camera_photo for any tenant', () => {
    registerCameraComponents();
    // Platform components are visible to all tenants as fallback
    const reg = componentRegistry.getComponent('camera_photo', 'some_tenant');
    expect(reg).toBeDefined();
    expect(reg!.manifest.fieldType).toBe('camera_photo');
  });

  it('componentRegistry.getComponent resolves camera_document for any tenant', () => {
    registerCameraComponents();
    const reg = componentRegistry.getComponent('camera_document', 'some_tenant');
    expect(reg).toBeDefined();
    expect(reg!.manifest.fieldType).toBe('camera_document');
  });

  it('is idempotent — calling twice does not throw', () => {
    registerCameraComponents();
    registerCameraComponents();
    const reg = componentRegistry.getComponent('camera_photo', PLATFORM_TENANT);
    expect(reg).toBeDefined();
  });

  it('manifests include validator definitions', () => {
    registerCameraComponents();
    const photoReg = componentRegistry.getComponent('camera_photo', PLATFORM_TENANT);
    expect(photoReg!.manifest.validators).toHaveLength(1);
    expect(photoReg!.manifest.validators![0].name).toBe('camera_photo_validator');

    const docReg = componentRegistry.getComponent('camera_document', PLATFORM_TENANT);
    expect(docReg!.manifest.validators).toHaveLength(1);
    expect(docReg!.manifest.validators![0].name).toBe('camera_document_validator');
  });

  it('manifests include default config', () => {
    registerCameraComponents();
    const photoReg = componentRegistry.getComponent('camera_photo', PLATFORM_TENANT);
    expect(photoReg!.manifest.defaultConfig).toBeDefined();
    expect((photoReg!.manifest.defaultConfig as any).jpegQuality).toBe(0.8);

    const docReg = componentRegistry.getComponent('camera_document', PLATFORM_TENANT);
    expect(docReg!.manifest.defaultConfig).toBeDefined();
    expect((docReg!.manifest.defaultConfig as any).minWidth).toBe(600);
  });
});
