/**
 * Indian government document validators for the Form Validation Engine.
 *
 * Each validator takes a raw string value and returns `null` when valid
 * or a `ValidationError` when invalid.  The `field` property is set to
 * an empty string — the caller (validate.ts) overrides it with the
 * actual field ID.
 */

import type { ValidationError } from './types.js';

// ---------------------------------------------------------------------------
// Verhoeff checksum tables
// ---------------------------------------------------------------------------

/** Multiplication table (d) for the dihedral group D₅. */
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

/** Permutation table (p). */
const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** Inverse table (inv). */
const VERHOEFF_INV: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

// ---------------------------------------------------------------------------
// Verhoeff helpers
// ---------------------------------------------------------------------------

/**
 * Validate a numeric string using the Verhoeff checksum algorithm.
 * Returns `true` when the check digit is correct.
 */
export function verhoeffValidate(num: string): boolean {
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * Generate the Verhoeff check digit for a numeric string.
 * Append the returned digit to the input to form a valid Verhoeff number.
 */
export function verhoeffGenerate(num: string): number {
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digits[i]]];
  }
  return VERHOEFF_INV[c];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeError(errorCode: string, message: string): ValidationError {
  return { field: '', errorCode, message };
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validate an Aadhaar number (12 digits with Verhoeff checksum).
 * Strips whitespace and hyphens before validation.
 */
export function validateAadhaar(value: string): ValidationError | null {
  const cleaned = value.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(cleaned)) {
    return makeError('INVALID_AADHAAR', 'Invalid Aadhaar number');
  }

  if (!verhoeffValidate(cleaned)) {
    return makeError('INVALID_AADHAAR', 'Invalid Aadhaar number');
  }

  return null;
}

/**
 * Validate a PAN (Permanent Account Number).
 * Strips whitespace before validation.
 * Format: 5 uppercase letters, 4 digits, 1 uppercase letter.
 */
export function validatePAN(value: string): ValidationError | null {
  const cleaned = value.replace(/\s/g, '');

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) {
    return makeError('INVALID_PAN', 'Invalid PAN number');
  }

  return null;
}

/**
 * Validate an Indian mobile number.
 * Strips non-digit characters, expects 10 digits starting with 6–9.
 */
export function validateMobileIN(value: string): ValidationError | null {
  const cleaned = value.replace(/\D/g, '');

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return makeError('INVALID_MOBILE_IN', 'Invalid Indian mobile number');
  }

  return null;
}

/**
 * Validate an IFSC (Indian Financial System Code).
 * Format: 4 uppercase letters, literal '0', 6 alphanumeric characters.
 */
export function validateIFSC(value: string): ValidationError | null {
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
    return makeError('INVALID_IFSC', 'Invalid IFSC code');
  }

  return null;
}

/**
 * Validate an Indian pincode.
 * Strips non-digit characters, expects exactly 6 digits.
 */
export function validatePincodeIN(value: string): ValidationError | null {
  const cleaned = value.replace(/\D/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return makeError('INVALID_PINCODE_IN', 'Invalid Indian pincode');
  }

  return null;
}

/**
 * Validate an email address.
 * Checks for exactly one '@' with non-empty local and domain parts.
 */
export function validateEmail(value: string): ValidationError | null {
  const atIndex = value.indexOf('@');

  // Must have exactly one '@'
  if (atIndex === -1 || value.lastIndexOf('@') !== atIndex) {
    return makeError('INVALID_EMAIL', 'Invalid email address');
  }

  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);

  if (local.length === 0 || domain.length === 0) {
    return makeError('INVALID_EMAIL', 'Invalid email address');
  }

  return null;
}

/**
 * Validate an Indian bank account number.
 * Strips non-digit characters, expects 9–18 digits.
 */
export function validateBankAccountIN(value: string): ValidationError | null {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length < 9 || cleaned.length > 18) {
    return makeError('INVALID_BANK_ACCOUNT_IN', 'Invalid Indian bank account number');
  }

  return null;
}
