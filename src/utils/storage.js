/**
 * localStorage persistence layer for EcoTrack.
 *
 * Security note: API keys (apiKey, geminiKey) are stored in plain localStorage.
 * This is adequate for a client-side app but users should be made aware that
 * any script with access to the same origin can read them. Never log or transmit
 * these values unnecessarily.
 */

const STORAGE_KEY = 'carbon_tracker_v1';

/** Top-level keys that are expected in a valid stored state object. */
const EXPECTED_KEYS = new Set([
  'profile', 'baseline', 'baselineBreakdown', 'dailyLogs',
  'committedActions', 'completedChallenges', 'badges',
  'apiKey', 'googleMapsKey', 'geminiKey', 'aiProvider', 'onboardingComplete',
]);

/**
 * Validate the shape of data retrieved from storage.
 * Returns the data if valid, null if it looks corrupted or unexpected.
 * @param {unknown} data
 * @returns {object|null}
 */
function validateStorageData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  // Must have at least one recognised key to be considered valid
  const hasKnownKey = Object.keys(data).some((k) => EXPECTED_KEYS.has(k));
  if (!hasKnownKey) return null;
  // Ensure critical array fields are arrays (prevent crashes from corrupted data)
  if (data.dailyLogs !== undefined && !Array.isArray(data.dailyLogs)) return null;
  if (data.badges !== undefined && !Array.isArray(data.badges)) return null;
  if (data.committedActions !== undefined && !Array.isArray(data.committedActions)) return null;
  return data;
}

export const storage = {
  /** Read and parse stored state. Returns null on missing / invalid data. */
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return validateStorageData(parsed);
    } catch {
      return null;
    }
  },

  /** Serialise and persist state. Silently ignores write failures (e.g. quota). */
  set(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },

  /**
   * Apply a partial patch to the currently stored state.
   * Useful for updating a single field without replacing the entire object.
   * @param {object} patch
   */
  update(patch) {
    try {
      const current = this.get() || {};
      this.set({ ...current, ...patch });
    } catch (e) {
      console.warn('localStorage update failed:', e);
    }
  },

  /** Remove all stored data for this app. */
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export const DEFAULT_STATE = {
  profile: null,           // onboarding data
  baseline: null,          // { total, breakdown }
  dailyLogs: [],           // [{ id, date, type, category, co2, label, icon }]
  committedActions: [],    // [{ id, tipId, title, saving, date }]
  completedChallenges: [], // [challengeId]
  badges: [],              // [badgeId]
  apiKey: '',              // Anthropic Claude API key
  googleMapsKey: '',       // Google Maps JavaScript API key
  geminiKey: '',           // Google Gemini API key
  aiProvider: 'gemini',   // 'gemini' | 'claude'
  onboardingComplete: false,
};
