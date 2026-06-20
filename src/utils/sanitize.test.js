import { describe, it, expect } from 'vitest';
import { sanitizeString, clampNumber, sanitizeProfile, sanitizeLogEntry } from './sanitize.js';

// ─── sanitizeString ──────────────────────────────────────────────────────────
describe('sanitizeString', () => {
  it('returns empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeString(undefined)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('strips ASCII control characters', () => {
    // \x01 is a control char, \n is kept
    expect(sanitizeString('hello\x01world')).toBe('helloworld');
  });

  it('enforces maxLen', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeString(long, 50)).toHaveLength(50);
  });

  it('uses default maxLen of 200', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeString(long)).toHaveLength(200);
  });

  it('coerces numbers to strings', () => {
    expect(sanitizeString(42)).toBe('42');
  });

  it('does not strip regular punctuation', () => {
    expect(sanitizeString('Hello, World! (test)')).toBe('Hello, World! (test)');
  });
});

// ─── clampNumber ─────────────────────────────────────────────────────────────
describe('clampNumber', () => {
  it('returns value within range unchanged', () => {
    expect(clampNumber(50, 0, 100)).toBe(50);
  });

  it('clamps below minimum to minimum', () => {
    expect(clampNumber(-5, 0, 100)).toBe(0);
  });

  it('clamps above maximum to maximum', () => {
    expect(clampNumber(200, 0, 100)).toBe(100);
  });

  it('returns fallback for NaN', () => {
    expect(clampNumber(NaN, 0, 100)).toBe(0);
  });

  it('returns fallback for non-numeric string', () => {
    expect(clampNumber('abc', 0, 100, 42)).toBe(42);
  });

  it('parses valid numeric strings', () => {
    expect(clampNumber('75', 0, 100)).toBe(75);
  });

  it('returns fallback for Infinity (not Number.isFinite)', () => {
    // parseFloat(Infinity) is Infinity which is NOT Number.isFinite, so fallback is returned
    expect(clampNumber(Infinity, 0, 100, 0)).toBe(0);
  });

  it('returns fallback for null (parseFloat(null) is NaN)', () => {
    // parseFloat(null) === NaN, so fallback is returned
    expect(clampNumber(null, 0, 100, 5)).toBe(5);
  });
});

// ─── sanitizeProfile ─────────────────────────────────────────────────────────
describe('sanitizeProfile', () => {
  it('returns null for null input', () => {
    expect(sanitizeProfile(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(sanitizeProfile('string')).toBeNull();
  });

  it('sanitizes country string', () => {
    const result = sanitizeProfile({ country: '  India  ' });
    expect(result.country).toBe('India');
  });

  it('clamps householdSize to valid range', () => {
    const result = sanitizeProfile({ householdSize: 999 });
    expect(result.householdSize).toBe(20);
  });

  it('uses householdSize fallback of 1 for invalid value', () => {
    const result = sanitizeProfile({ householdSize: 'abc' });
    expect(result.householdSize).toBe(1);
  });

  it('sanitizes nested diet type', () => {
    const result = sanitizeProfile({ diet: { type: '  vegan  ' } });
    expect(result.diet.type).toBe('vegan');
  });

  it('clamps weeklyKm to 0–10000', () => {
    const result = sanitizeProfile({ transport: { primaryMode: 'car', weeklyKm: -100 } });
    expect(result.transport.weeklyKm).toBe(0);
  });

  it('sanitizes a full valid profile', () => {
    const profile = {
      country: 'India',
      householdSize: 3,
      diet: { type: 'omnivore' },
      transport: { primaryMode: 'car', weeklyKm: 150 },
      energy: { source: 'mixed', monthlyKwh: 400 },
    };
    const result = sanitizeProfile(profile);
    expect(result.country).toBe('India');
    expect(result.householdSize).toBe(3);
    expect(result.diet.type).toBe('omnivore');
    expect(result.transport.weeklyKm).toBe(150);
    expect(result.energy.monthlyKwh).toBe(400);
  });
});

// ─── sanitizeLogEntry ─────────────────────────────────────────────────────────
describe('sanitizeLogEntry', () => {
  it('returns empty object for null input', () => {
    expect(sanitizeLogEntry(null)).toEqual({});
  });

  it('clamps co2 to non-negative', () => {
    const result = sanitizeLogEntry({ co2: -10, label: 'test', category: 'transport', type: 'car', icon: 'Car' });
    expect(result.co2).toBe(0);
  });

  it('sanitizes label', () => {
    const result = sanitizeLogEntry({ co2: 5, label: '  Drove to work  ', category: 'transport', type: 'car', icon: 'Car' });
    expect(result.label).toBe('Drove to work');
  });

  it('preserves extra fields (e.g. color)', () => {
    const result = sanitizeLogEntry({ co2: 5, label: 'test', category: 'food', type: 'beef', icon: 'Beef', color: '#E63946' });
    expect(result.color).toBe('#E63946');
  });
});
