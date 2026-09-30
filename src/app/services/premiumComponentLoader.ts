/**
 * Premium Component Loader
 *
 * Registers all four premium (platform-level) custom components under
 * the `__platform__` tenant scope in the ComponentRegistry, and registers
 * their associated custom validators in the CustomValidatorRegistry.
 *
 * Call `loadPremiumComponents()` once at application startup.
 */

import { componentRegistry, PLATFORM_TENANT } from './componentRegistry';
import { customValidatorRegistry } from '@serviceformai/form-engine-core';
import type { ComponentManifest } from '../types/customComponent';

// Premium component imports
import AddressPicker, {
  addressStructureValidator,
} from '../components/premium/AddressPicker';
import SignaturePad, {
  signatureFormatValidator,
} from '../components/premium/SignaturePad';
import FileScanner, {
  fileScanFormatValidator,
} from '../components/premium/FileScanner';
import OTPInput, {
  otpFormatValidator,
} from '../components/premium/OTPInput';

// Camera capture components
import { registerCameraComponents } from '../components/camera/register';

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

const ADDRESS_PICKER_MANIFEST: ComponentManifest = {
  fieldType: 'address_picker',
  displayName: 'Address Picker',
  version: '1.0.0',
  description: 'Address input with structured output (street, city, state, postal code, country)',
  validators: [
    {
      name: 'address_structure',
      description: 'Validates address has all required fields',
    },
  ],
  defaultConfig: {
    country: 'IN',
  },
};

const SIGNATURE_PAD_MANIFEST: ComponentManifest = {
  fieldType: 'signature_pad',
  displayName: 'Signature Pad',
  version: '1.0.0',
  description: 'Canvas-based signature capture, outputs base64 PNG',
  validators: [
    {
      name: 'signature_format',
      description: 'Validates value is a valid base64 PNG string',
    },
  ],
};

const FILE_SCANNER_MANIFEST: ComponentManifest = {
  fieldType: 'file_scanner',
  displayName: 'File Scanner',
  version: '1.0.0',
  description: 'Camera capture for document scanning with metadata',
  validators: [
    {
      name: 'file_scan_format',
      description: 'Validates scanned file has data, mimeType, and fileSize',
    },
  ],
};

const OTP_INPUT_MANIFEST: ComponentManifest = {
  fieldType: 'otp_input',
  displayName: 'OTP Input',
  version: '1.0.0',
  description: 'Segmented OTP input with configurable digit count',
  validators: [
    {
      name: 'otp_format',
      description: 'Validates OTP is a digit string of the expected length',
    },
  ],
  defaultConfig: {
    digits: 6,
  },
};

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

let loaded = false;

/**
 * Register all premium components and their validators.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function loadPremiumComponents(): void {
  if (loaded) return;

  // Register components in the ComponentRegistry under __platform__
  componentRegistry.register(PLATFORM_TENANT, ADDRESS_PICKER_MANIFEST, AddressPicker);
  componentRegistry.register(PLATFORM_TENANT, SIGNATURE_PAD_MANIFEST, SignaturePad);
  componentRegistry.register(PLATFORM_TENANT, FILE_SCANNER_MANIFEST, FileScanner);
  componentRegistry.register(PLATFORM_TENANT, OTP_INPUT_MANIFEST, OTPInput);

  // Register custom validators in the CustomValidatorRegistry
  customValidatorRegistry.register('address_structure', addressStructureValidator as any);
  customValidatorRegistry.register('signature_format', signatureFormatValidator as any);
  customValidatorRegistry.register('file_scan_format', fileScanFormatValidator as any);
  customValidatorRegistry.register('otp_format', otpFormatValidator as any);

  // Register camera capture components and validators
  registerCameraComponents();

  loaded = true;
}

/**
 * Reset the loaded state (for testing purposes only).
 */
export function resetPremiumComponents(): void {
  loaded = false;
}
