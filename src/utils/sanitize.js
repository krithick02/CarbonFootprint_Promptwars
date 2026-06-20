/**
 * Input sanitization utilities.
 *
 * Used before embedding user-supplied data into AI prompts or storing
 * values that could contain unexpected characters.
 */

/**
 * Strip control characters, trim whitespace, and enforce a maximum length.
 * @param {unknown} value - The value to sanitize (coerced to string).
 * @param {number} [maxLen=200] - Maximum allowed character length.
 * @returns {string}
 */
export function sanitizeString(value, maxLen = 200) {
  if (value === null || value === undefined) return '';
  // Coerce to string, remove ASCII control chars (except newline/tab)
  const str = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  return str.slice(0, maxLen);
}

/**
 * Clamp a numeric value to a valid range.
 * Returns `fallback` if the value is not a finite number.
 * @param {unknown} value - The value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @param {number} [fallback=0] - Value returned when input is not numeric.
 * @returns {number}
 */
export function clampNumber(value, min, max, fallback = 0) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * Sanitize a user profile object before embedding it in an AI prompt.
 * All fields are coerced to safe strings / clamped numbers.
 * @param {object|null} profile
 * @returns {object|null}
 */
export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;

  const sanitized = {};

  if (profile.country !== undefined) {
    sanitized.country = sanitizeString(profile.country, 60);
  }

  if (profile.householdSize !== undefined) {
    sanitized.householdSize = clampNumber(profile.householdSize, 1, 20, 1);
  }

  if (profile.diet && typeof profile.diet === 'object') {
    sanitized.diet = {
      type: sanitizeString(profile.diet.type, 30),
    };
  }

  if (profile.transport && typeof profile.transport === 'object') {
    sanitized.transport = {
      primaryMode: sanitizeString(profile.transport.primaryMode, 30),
      weeklyKm: clampNumber(profile.transport.weeklyKm, 0, 10000, 0),
    };
  }

  if (profile.energy && typeof profile.energy === 'object') {
    sanitized.energy = {
      source: sanitizeString(profile.energy.source, 30),
      monthlyKwh: clampNumber(profile.energy.monthlyKwh, 0, 100000, 0),
    };
  }

  return sanitized;
}

/**
 * Sanitize a daily log entry's mutable fields.
 * @param {object} entry
 * @returns {object}
 */
export function sanitizeLogEntry(entry) {
  if (!entry || typeof entry !== 'object') return {};
  return {
    ...entry,
    co2: clampNumber(entry.co2, 0, 100000, 0),
    label: sanitizeString(entry.label, 100),
    category: sanitizeString(entry.category, 30),
    type: sanitizeString(entry.type, 30),
    icon: sanitizeString(entry.icon, 30),
  };
}
