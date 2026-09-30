import {
  parseComponentManifest,
  prettyPrintManifest,
} from './manifest-parser';
import type { ComponentManifest, ManifestParseError } from './manifest-parser';

/** Type guard for ManifestParseError. */
function isManifestError(
  val: ComponentManifest | ManifestParseError,
): val is ManifestParseError {
  return (val as ManifestParseError).error === true;
}

// ---------------------------------------------------------------------------
// parseComponentManifest
// ---------------------------------------------------------------------------

describe('parseComponentManifest', () => {
  const validManifest: ComponentManifest = {
    fieldType: 'address_picker',
    displayName: 'Address Picker',
    version: '1.0.0',
  };

  it('parses a valid manifest JSON string', () => {
    const json = JSON.stringify(validManifest);
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(false);
    const manifest = result as ComponentManifest;
    expect(manifest.fieldType).toBe('address_picker');
    expect(manifest.displayName).toBe('Address Picker');
    expect(manifest.version).toBe('1.0.0');
  });

  it('parses a manifest with all optional properties', () => {
    const full: ComponentManifest = {
      fieldType: 'signature_pad',
      displayName: 'Signature Pad',
      version: '2.1.0',
      description: 'Canvas-based signature capture',
      bundleUrl: 'https://cdn.example.com/sig-pad/2.1.0/index.js',
      validators: [
        { name: 'signature_format', description: 'Validates base64 PNG' },
      ],
      defaultConfig: { strokeWidth: 2, color: '#000' },
      allowedDomains: ['api.example.com'],
    };
    const json = JSON.stringify(full);
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(false);
    const manifest = result as ComponentManifest;
    expect(manifest.description).toBe('Canvas-based signature capture');
    expect(manifest.validators).toHaveLength(1);
    expect(manifest.defaultConfig).toEqual({ strokeWidth: 2, color: '#000' });
    expect(manifest.allowedDomains).toEqual(['api.example.com']);
  });

  it('returns ManifestParseError for invalid JSON syntax', () => {
    const result = parseComponentManifest('{ not valid }');

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.error).toBe(true);
    expect(err.message).toContain('Invalid JSON');
  });

  it('returns ManifestParseError when input is a JSON array', () => {
    const result = parseComponentManifest('[1, 2]');

    expect(isManifestError(result)).toBe(true);
    expect((result as ManifestParseError).message).toContain('object');
  });

  it('returns ManifestParseError when input is JSON null', () => {
    const result = parseComponentManifest('null');

    expect(isManifestError(result)).toBe(true);
    expect((result as ManifestParseError).message).toContain('object');
  });

  it('returns ManifestParseError when fieldType is missing', () => {
    const json = JSON.stringify({ displayName: 'Test', version: '1.0.0' });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toContain('fieldType');
  });

  it('returns ManifestParseError when displayName is missing', () => {
    const json = JSON.stringify({ fieldType: 'test', version: '1.0.0' });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toContain('displayName');
  });

  it('returns ManifestParseError when version is missing', () => {
    const json = JSON.stringify({ fieldType: 'test', displayName: 'Test' });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toContain('version');
  });

  it('returns ManifestParseError listing all missing properties', () => {
    const json = JSON.stringify({ description: 'just a description' });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toEqual(
      expect.arrayContaining(['fieldType', 'displayName', 'version']),
    );
    expect(err.missingProperties).toHaveLength(3);
  });

  it('returns ManifestParseError when required properties are empty strings', () => {
    const json = JSON.stringify({
      fieldType: '',
      displayName: '',
      version: '',
    });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toHaveLength(3);
  });

  it('returns ManifestParseError when required properties are non-string types', () => {
    const json = JSON.stringify({
      fieldType: 123,
      displayName: true,
      version: null,
    });
    const result = parseComponentManifest(json);

    expect(isManifestError(result)).toBe(true);
    const err = result as ManifestParseError;
    expect(err.missingProperties).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// prettyPrintManifest
// ---------------------------------------------------------------------------

describe('prettyPrintManifest', () => {
  it('produces sorted keys with 2-space indentation', () => {
    const manifest: ComponentManifest = {
      fieldType: 'otp_input',
      displayName: 'OTP Input',
      version: '1.0.0',
    };

    const output = prettyPrintManifest(manifest);
    const parsed = JSON.parse(output);

    const topKeys = Object.keys(parsed);
    expect(topKeys).toEqual([...topKeys].sort());
    expect(output).toContain('  "displayName"');
  });

  it('sorts keys at nested levels', () => {
    const manifest: ComponentManifest = {
      fieldType: 'test',
      displayName: 'Test',
      version: '1.0.0',
      defaultConfig: { zebra: 1, alpha: 2 },
    };

    const output = prettyPrintManifest(manifest);
    const parsed = JSON.parse(output);

    const configKeys = Object.keys(parsed.defaultConfig);
    expect(configKeys).toEqual(['alpha', 'zebra']);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: prettyPrint(parse(prettyPrint(manifest)))
// ---------------------------------------------------------------------------

describe('round-trip: prettyPrint(parse(prettyPrint(manifest)))', () => {
  it('produces identical output on double round-trip', () => {
    const manifest: ComponentManifest = {
      fieldType: 'address_picker',
      displayName: 'Address Picker',
      version: '1.0.0',
      description: 'Address input with geocoding',
      bundleUrl: 'https://cdn.example.com/address/1.0.0/index.js',
      validators: [
        {
          name: 'address_structure',
          description: 'Validates address fields',
          params: { requirePostalCode: true },
        },
      ],
      defaultConfig: { mapProvider: 'google', country: 'IN' },
      allowedDomains: ['maps.googleapis.com'],
    };

    const firstPrint = prettyPrintManifest(manifest);
    const reparsed = parseComponentManifest(firstPrint);
    expect(isManifestError(reparsed)).toBe(false);

    const secondPrint = prettyPrintManifest(reparsed as ComponentManifest);
    expect(secondPrint).toBe(firstPrint);
  });

  it('preserves all optional properties through round-trip', () => {
    const manifest: ComponentManifest = {
      fieldType: 'file_scanner',
      displayName: 'File Scanner',
      version: '3.0.0',
      validators: [{ name: 'file_scan_format' }],
      allowedDomains: ['api.scanner.com', 'cdn.scanner.com'],
    };

    const firstPrint = prettyPrintManifest(manifest);
    const reparsed = parseComponentManifest(firstPrint) as ComponentManifest;
    const secondPrint = prettyPrintManifest(reparsed);
    expect(secondPrint).toBe(firstPrint);
  });
});
