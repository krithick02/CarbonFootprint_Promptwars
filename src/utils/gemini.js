/**
 * Google Gemini API client for generating personalised carbon reduction tips.
 * Uses the gemini-1.5-flash model (generous free tier).
 * API key is read from VITE_GEMINI_KEY env var, or passed directly.
 *
 * Security notes:
 *  - All user-supplied values are sanitized before being embedded in the prompt.
 *  - Requests time out after 30 seconds to avoid hanging indefinitely.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeString, clampNumber, sanitizeProfile } from './sanitize.js';

/** Maximum time (ms) to wait for the API before aborting. */
const REQUEST_TIMEOUT_MS = 30_000;

export async function generateTipsGemini({ profile, baseline, topCategories, geminiKey }) {
  const key = geminiKey || import.meta.env.VITE_GEMINI_KEY || '';

  if (!key) {
    throw new Error('NO_API_KEY');
  }

  // ── Sanitize inputs ─────────────────────────────────────────────────────────
  const safeProfile = sanitizeProfile(profile);
  const safeBaseline = clampNumber(baseline, 0, 1_000_000, 0);

  const safeCategories = Array.isArray(topCategories)
    ? topCategories.slice(0, 5).map((c) => ({
        name: sanitizeString(c?.name, 30),
        value: clampNumber(c?.value, 0, 100_000, 0),
      }))
    : [];

  const categoryDescriptions = safeCategories
    .map((c) => `${c.name} (${c.value} kg CO₂/month)`)
    .join(', ');

  const profileSummary = safeProfile
    ? `Country: ${safeProfile.country || 'Unknown'}, Household size: ${safeProfile.householdSize || 1}, Diet: ${safeProfile.diet?.type || 'omnivore'}, Primary transport: ${safeProfile.transport?.primaryMode || 'car'}, Energy source: ${safeProfile.energy?.source || 'mixed'}.`
    : 'Unknown profile.';

  const prompt = `You are a friendly carbon footprint reduction expert. Based on the user's profile and top emission categories, generate exactly 5 personalized, actionable tips to reduce their carbon footprint.

User Profile: ${profileSummary}
Annual baseline: ${safeBaseline > 0 ? Math.round((safeBaseline / 1000) * 100) / 100 : '?'} tonnes CO₂/year
Top emission categories: ${categoryDescriptions}

Return your response as a valid JSON array with exactly 5 objects, each with this structure:
{
  "id": "unique_tip_id",
  "title": "Short actionable title (max 8 words)",
  "description": "2-sentence explanation of how and why to do this",
  "category": "transport|food|energy|shopping",
  "monthlySaving": <number in kg CO₂>,
  "difficulty": "Easy|Medium|Hard",
  "action": "The specific change to make (1 sentence)"
}

Make the tips specific to the user's highest emission categories. Be encouraging and practical. Return only the JSON array, no other text.`;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Race the API call against a timeout promise
    const apiCall = model.generateContent(prompt);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), REQUEST_TIMEOUT_MS)
    );

    const result = await Promise.race([apiCall, timeout]);
    const text = result.response.text();

    // Strip markdown code fences if present
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const tips = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return Array.isArray(tips) ? tips : [];
  } catch (err) {
    if (err.message === 'REQUEST_TIMEOUT') {
      throw new Error('REQUEST_TIMEOUT', { cause: err });
    }
    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
      throw new Error('INVALID_API_KEY', { cause: err });
    }
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      throw new Error('RATE_LIMITED', { cause: err });
    }
    throw new Error(`GEMINI_ERROR: ${err.message}`, { cause: err });
  }
}
