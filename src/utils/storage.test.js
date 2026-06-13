import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage, DEFAULT_STATE } from './storage.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ─── storage.get ─────────────────────────────────────────────────────────────
describe('storage.get', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('returns null when nothing is stored', () => {
    expect(storage.get()).toBeNull();
  });

  it('parses and returns stored JSON', () => {
    const data = { onboardingComplete: true, baseline: 1200 };
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify(data));
    expect(storage.get()).toEqual(data);
  });

  it('returns null on invalid JSON (graceful)', () => {
    localStorageMock.setItem('carbon_tracker_v1', '{ not: valid json }');
    expect(storage.get()).toBeNull();
  });
});

// ─── storage.set ─────────────────────────────────────────────────────────────
describe('storage.set', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('serialises and stores data', () => {
    const data = { profile: { name: 'test' } };
    storage.set(data);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'carbon_tracker_v1',
      JSON.stringify(data)
    );
  });

  it('does not throw when localStorage is unavailable', () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
    expect(() => storage.set({ foo: 'bar' })).not.toThrow();
  });
});

// ─── storage.clear ───────────────────────────────────────────────────────────
describe('storage.clear', () => {
  it('removes the stored key', () => {
    storage.clear();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('carbon_tracker_v1');
  });
});

// ─── DEFAULT_STATE ───────────────────────────────────────────────────────────
describe('DEFAULT_STATE', () => {
  it('has all required top-level keys', () => {
    const requiredKeys = [
      'profile', 'baseline', 'dailyLogs', 'committedActions',
      'completedChallenges', 'badges', 'apiKey', 'googleMapsKey',
      'geminiKey', 'aiProvider', 'onboardingComplete',
    ];
    requiredKeys.forEach((key) => {
      expect(DEFAULT_STATE).toHaveProperty(key);
    });
  });

  it('onboardingComplete defaults to false', () => {
    expect(DEFAULT_STATE.onboardingComplete).toBe(false);
  });

  it('dailyLogs defaults to empty array', () => {
    expect(Array.isArray(DEFAULT_STATE.dailyLogs)).toBe(true);
    expect(DEFAULT_STATE.dailyLogs).toHaveLength(0);
  });

  it('aiProvider defaults to gemini', () => {
    expect(DEFAULT_STATE.aiProvider).toBe('gemini');
  });
});
