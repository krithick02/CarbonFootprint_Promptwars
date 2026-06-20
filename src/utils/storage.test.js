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
    const data = { onboardingComplete: true, baseline: 1200, dailyLogs: [], badges: [], committedActions: [] };
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify(data));
    expect(storage.get()).toEqual(data);
  });

  it('returns null on invalid JSON (graceful)', () => {
    localStorageMock.setItem('carbon_tracker_v1', '{ not: valid json }');
    expect(storage.get()).toBeNull();
  });

  it('returns null for an array (wrong shape)', () => {
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify([1, 2, 3]));
    expect(storage.get()).toBeNull();
  });

  it('returns null when stored object has no recognised keys', () => {
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify({ unknownKey: 'hello' }));
    expect(storage.get()).toBeNull();
  });

  it('returns null when dailyLogs is not an array (corrupted)', () => {
    const corrupted = { onboardingComplete: true, dailyLogs: 'bad', badges: [], committedActions: [] };
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify(corrupted));
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

// ─── storage.update ───────────────────────────────────────────────────────────
describe('storage.update', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('merges patch into existing stored data', () => {
    const initial = { onboardingComplete: false, baseline: 1000, dailyLogs: [], badges: [], committedActions: [] };
    localStorageMock.setItem('carbon_tracker_v1', JSON.stringify(initial));
    storage.update({ onboardingComplete: true });
    const raw = localStorageMock.setItem.mock.calls.at(-1)[1];
    const updated = JSON.parse(raw);
    expect(updated.onboardingComplete).toBe(true);
    expect(updated.baseline).toBe(1000); // untouched field preserved
  });

  it('creates a new object when nothing is stored', () => {
    storage.update({ apiKey: 'test-key' });
    const raw = localStorageMock.setItem.mock.calls.at(-1)[1];
    const stored = JSON.parse(raw);
    expect(stored.apiKey).toBe('test-key');
  });

  it('does not throw when localStorage is unavailable', () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
    expect(() => storage.update({ foo: 'bar' })).not.toThrow();
  });
});

// ─── storage.clear ───────────────────────────────────────────────────────────
describe('storage.clear', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

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

  it('apiKey defaults to empty string', () => {
    expect(DEFAULT_STATE.apiKey).toBe('');
  });

  it('badges defaults to empty array', () => {
    expect(Array.isArray(DEFAULT_STATE.badges)).toBe(true);
  });
});
