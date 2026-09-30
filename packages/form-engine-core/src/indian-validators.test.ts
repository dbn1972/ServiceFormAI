/**
 * Unit tests for Indian government document validators.
 */

import {
  validateAadhaar,
  validatePAN,
  validateMobileIN,
  validateIFSC,
  validatePincodeIN,
  validateEmail,
  validateBankAccountIN,
  verhoeffValidate,
  verhoeffGenerate,
} from './indian-validators.js';

// ---------------------------------------------------------------------------
// Verhoeff checksum helpers
// ---------------------------------------------------------------------------

describe('verhoeffValidate', () => {
  it('returns true for a known valid number', () => {
    // Generate a check digit for "12345678901" and validate the full number
    const checkDigit = verhoeffGenerate('12345678901');
    expect(verhoeffValidate('12345678901' + checkDigit)).toBe(true);
  });

  it('returns false when the check digit is wrong', () => {
    const checkDigit = verhoeffGenerate('12345678901');
    const wrongDigit = (checkDigit + 1) % 10;
    expect(verhoeffValidate('12345678901' + wrongDigit)).toBe(false);
  });
});

describe('verhoeffGenerate', () => {
  it('generates a digit 0–9', () => {
    const digit = verhoeffGenerate('98765432101');
    expect(digit).toBeGreaterThanOrEqual(0);
    expect(digit).toBeLessThanOrEqual(9);
  });

  it('generated digit makes the full number pass validation', () => {
    const prefix = '98765432101';
    const digit = verhoeffGenerate(prefix);
    expect(verhoeffValidate(prefix + digit)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateAadhaar
// ---------------------------------------------------------------------------

describe('validateAadhaar', () => {
  // Build a valid Aadhaar from a known prefix
  const prefix = '12345678901';
  const checkDigit = verhoeffGenerate(prefix);
  const validAadhaar = prefix + checkDigit;

  it('returns null for a valid 12-digit Aadhaar', () => {
    expect(validateAadhaar(validAadhaar)).toBeNull();
  });

  it('returns null when valid Aadhaar contains spaces', () => {
    const spaced = validAadhaar.slice(0, 4) + ' ' + validAadhaar.slice(4, 8) + ' ' + validAadhaar.slice(8);
    expect(validateAadhaar(spaced)).toBeNull();
  });

  it('returns null when valid Aadhaar contains hyphens', () => {
    const hyphenated = validAadhaar.slice(0, 4) + '-' + validAadhaar.slice(4, 8) + '-' + validAadhaar.slice(8);
    expect(validateAadhaar(hyphenated)).toBeNull();
  });

  it('returns error for non-12-digit string', () => {
    const result = validateAadhaar('12345');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_AADHAAR');
  });

  it('returns error for 12 digits with wrong checksum', () => {
    const wrongDigit = (checkDigit + 1) % 10;
    const invalidAadhaar = prefix + wrongDigit;
    const result = validateAadhaar(invalidAadhaar);
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_AADHAAR');
  });

  it('returns error for alphabetic characters', () => {
    const result = validateAadhaar('12345678901A');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_AADHAAR');
  });

  it('sets field to empty string', () => {
    const result = validateAadhaar('12345');
    expect(result!.field).toBe('');
  });
});

// ---------------------------------------------------------------------------
// validatePAN
// ---------------------------------------------------------------------------

describe('validatePAN', () => {
  it('returns null for a valid PAN', () => {
    expect(validatePAN('ABCDE1234F')).toBeNull();
  });

  it('returns null when valid PAN has leading/trailing whitespace', () => {
    expect(validatePAN('  ABCDE1234F  ')).toBeNull();
  });

  it('returns error for lowercase letters', () => {
    const result = validatePAN('abcde1234f');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PAN');
  });

  it('returns error for wrong format', () => {
    const result = validatePAN('12345ABCDE');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PAN');
  });

  it('returns error for too short', () => {
    const result = validatePAN('ABCDE');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PAN');
  });

  it('returns error for too long', () => {
    const result = validatePAN('ABCDE1234FG');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PAN');
  });
});

// ---------------------------------------------------------------------------
// validateMobileIN
// ---------------------------------------------------------------------------

describe('validateMobileIN', () => {
  it('returns null for valid mobile starting with 6', () => {
    expect(validateMobileIN('6123456789')).toBeNull();
  });

  it('returns null for valid mobile starting with 9', () => {
    expect(validateMobileIN('9876543210')).toBeNull();
  });

  it('returns null when mobile has non-digit separators', () => {
    // After stripping non-digits: '9876543210' (10 digits starting with 9)
    expect(validateMobileIN('98765-43210')).toBeNull();
  });

  it('returns error for mobile starting with 5', () => {
    const result = validateMobileIN('5123456789');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_MOBILE_IN');
  });

  it('returns error for 9 digits', () => {
    const result = validateMobileIN('912345678');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_MOBILE_IN');
  });

  it('returns error for 11 digits', () => {
    const result = validateMobileIN('91234567890');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_MOBILE_IN');
  });
});

// ---------------------------------------------------------------------------
// validateIFSC
// ---------------------------------------------------------------------------

describe('validateIFSC', () => {
  it('returns null for a valid IFSC code', () => {
    expect(validateIFSC('SBIN0001234')).toBeNull();
  });

  it('returns null for IFSC with alphanumeric branch code', () => {
    expect(validateIFSC('HDFC0ABCDEF')).toBeNull();
  });

  it('returns error for lowercase letters', () => {
    const result = validateIFSC('sbin0001234');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_IFSC');
  });

  it('returns error when 5th character is not 0', () => {
    const result = validateIFSC('SBIN1001234');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_IFSC');
  });

  it('returns error for too short', () => {
    const result = validateIFSC('SBIN0');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_IFSC');
  });

  it('returns error for too long', () => {
    const result = validateIFSC('SBIN00012345');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_IFSC');
  });
});

// ---------------------------------------------------------------------------
// validatePincodeIN
// ---------------------------------------------------------------------------

describe('validatePincodeIN', () => {
  it('returns null for a valid 6-digit pincode', () => {
    expect(validatePincodeIN('110001')).toBeNull();
  });

  it('returns null when pincode has spaces', () => {
    expect(validatePincodeIN('110 001')).toBeNull();
  });

  it('returns error for 5 digits', () => {
    const result = validatePincodeIN('11000');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PINCODE_IN');
  });

  it('returns error for 7 digits', () => {
    const result = validatePincodeIN('1100012');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PINCODE_IN');
  });

  it('returns error for alphabetic characters only', () => {
    const result = validatePincodeIN('abcdef');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_PINCODE_IN');
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns null for minimal valid email', () => {
    expect(validateEmail('a@b')).toBeNull();
  });

  it('returns error when no @ present', () => {
    const result = validateEmail('userexample.com');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_EMAIL');
  });

  it('returns error when multiple @ present', () => {
    const result = validateEmail('user@@example.com');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_EMAIL');
  });

  it('returns error when local part is empty', () => {
    const result = validateEmail('@example.com');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_EMAIL');
  });

  it('returns error when domain part is empty', () => {
    const result = validateEmail('user@');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_EMAIL');
  });
});

// ---------------------------------------------------------------------------
// validateBankAccountIN
// ---------------------------------------------------------------------------

describe('validateBankAccountIN', () => {
  it('returns null for 9-digit account', () => {
    expect(validateBankAccountIN('123456789')).toBeNull();
  });

  it('returns null for 18-digit account', () => {
    expect(validateBankAccountIN('123456789012345678')).toBeNull();
  });

  it('returns null for 12-digit account with hyphens', () => {
    expect(validateBankAccountIN('1234-5678-9012')).toBeNull();
  });

  it('returns error for 8 digits', () => {
    const result = validateBankAccountIN('12345678');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_BANK_ACCOUNT_IN');
  });

  it('returns error for 19 digits', () => {
    const result = validateBankAccountIN('1234567890123456789');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_BANK_ACCOUNT_IN');
  });

  it('returns error for empty string', () => {
    const result = validateBankAccountIN('');
    expect(result).not.toBeNull();
    expect(result!.errorCode).toBe('INVALID_BANK_ACCOUNT_IN');
  });
});
