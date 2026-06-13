const STORAGE_KEY = 'carbon_tracker_v1';

export const storage = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },

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

