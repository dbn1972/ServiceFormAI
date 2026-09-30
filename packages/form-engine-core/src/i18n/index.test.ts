import { getDefaultMessage } from './index';
import { localeMessages } from './messages';
import type { SupportedLocale } from '../types';

const ALL_LOCALES: SupportedLocale[] = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn'];

const ALL_ERROR_CODES = [
  'REQUIRED',
  'MIN_LENGTH',
  'MAX_LENGTH',
  'MIN_VALUE',
  'MAX_VALUE',
  'PATTERN_MISMATCH',
  'INVALID_OPTION',
  'DATE_OUT_OF_RANGE',
  'FILE_TOO_LARGE',
  'INVALID_FILE_TYPE',
  'INVALID_AADHAAR',
  'INVALID_PAN',
  'INVALID_MOBILE_IN',
  'INVALID_IFSC',
  'INVALID_PINCODE_IN',
  'INVALID_EMAIL',
  'INVALID_BANK_ACCOUNT_IN',
  'DATE_ORDER_VIOLATION',
  'CONDITIONAL_REQUIRED',
  'SUM_MISMATCH',
  'MUTUALLY_EXCLUSIVE_VIOLATION',
  'FIELD_MISMATCH',
  'UNKNOWN_STEP',
];

describe('i18n — getDefaultMessage', () => {
  // 1. English messages work for all error codes
  describe('English messages for all error codes', () => {
    it.each(ALL_ERROR_CODES)('returns a non-empty English message for %s', (code) => {
      const msg = getDefaultMessage(code, 'en');
      expect(msg).toBeTruthy();
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  // 2. All locales return non-empty messages for all error codes
  describe('all locales return non-empty messages for all error codes', () => {
    for (const locale of ALL_LOCALES) {
      describe(`locale: ${locale}`, () => {
        it.each(ALL_ERROR_CODES)(`returns a non-empty message for %s`, (code) => {
          const msg = getDefaultMessage(code, locale);
          expect(msg).toBeTruthy();
          expect(msg.length).toBeGreaterThan(0);
        });
      });
    }
  });

  // 3. Field label substitution works
  describe('field label substitution', () => {
    it('replaces {field} with the provided field label', () => {
      const msg = getDefaultMessage('REQUIRED', 'en', 'Full Name');
      expect(msg).toBe('Full Name is required');
    });

    it('uses "This field" when no field label is provided', () => {
      const msg = getDefaultMessage('REQUIRED', 'en');
      expect(msg).toBe('This field is required');
    });

    it('replaces {field} in non-English locales', () => {
      const msg = getDefaultMessage('REQUIRED', 'hi', 'पूरा नाम');
      expect(msg).toContain('पूरा नाम');
    });
  });

  // 4. Fallback to English when locale doesn't have the error code
  describe('fallback to English', () => {
    it('falls back to English when the locale map is missing the error code', () => {
      // Temporarily remove a key from Hindi to test fallback
      const originalHi = { ...localeMessages.hi };
      delete (localeMessages.hi as any)['REQUIRED'];

      const msg = getDefaultMessage('REQUIRED', 'hi', 'Name');
      expect(msg).toBe('Name is required');

      // Restore
      Object.assign(localeMessages.hi, originalHi);
    });
  });

  // 5. Fallback to generic message when error code is unknown
  describe('fallback to generic message', () => {
    it('returns "Validation failed" for an unknown error code', () => {
      const msg = getDefaultMessage('TOTALLY_UNKNOWN_CODE', 'en');
      expect(msg).toBe('Validation failed');
    });

    it('returns "Validation failed" for an unknown error code in non-English locale', () => {
      const msg = getDefaultMessage('TOTALLY_UNKNOWN_CODE', 'hi');
      expect(msg).toBe('Validation failed');
    });
  });

  // Additional: verify all locale maps have all error codes
  describe('locale completeness', () => {
    it.each(ALL_LOCALES)('locale %s has entries for all error codes', (locale) => {
      const map = localeMessages[locale];
      for (const code of ALL_ERROR_CODES) {
        expect(map[code]).toBeDefined();
        expect(map[code].length).toBeGreaterThan(0);
      }
    });

    it.each(ALL_LOCALES)('locale %s templates contain {field} placeholder', (locale) => {
      const map = localeMessages[locale];
      for (const code of ALL_ERROR_CODES) {
        // UNKNOWN_STEP doesn't need a {field} placeholder
        if (code === 'UNKNOWN_STEP') continue;
        expect(map[code]).toContain('{field}');
      }
    });
  });
});
