/**
 * Claude API client for generating personalized carbon reduction tips.
 * Uses the Anthropic claude-sonnet-4-6 model.
 * API key is read from VITE_ANTHROPIC_API_KEY env var, or passed directly.
 */

export async function generateTips({ profile, baseline, topCategories, apiKey }) {
  const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || '';

  if (!key) {
    throw new Error('NO_API_KEY');
  }

  const categoryDescriptions = topCategories
    .map((c) => `${c.name} (${c.value} kg CO₂/month)`)
    .join(', ');

  const profileSummary = profile
    ? `Country: ${profile.country || 'Unknown'}, Household size: ${profile.householdSize || 1}, Diet: ${profile.diet?.type || 'omnivore'}, Primary transport: ${profile.transport?.primaryMode || 'car'}, Energy source: ${profile.energy?.source || 'mixed'}.`
    : 'Unknown profile.';

  const prompt = `You are a friendly carbon footprint reduction expert. Based on the user's profile and top emission categories, generate exactly 5 personalized, actionable tips to reduce their carbon footprint.

User Profile: ${profileSummary}
Annual baseline: ${baseline ? Math.round(baseline / 1000 * 100) / 100 : '?'} tonnes CO₂/year
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) throw new Error('INVALID_API_KEY');
    if (response.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`API_ERROR: ${errText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '[]';

  try {
    // Extract JSON from the response (strip any markdown code fences)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const tips = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    return Array.isArray(tips) ? tips : [];
  } catch {
    throw new Error('PARSE_ERROR');
  }
}

/** Fallback tips when API is unavailable */
export const FALLBACK_TIPS = [
  {
    id: 'fallback_1',
    title: 'Switch to plant-based meals 3× a week',
    description: 'Replacing meat with plant-based alternatives just 3 days a week can significantly cut your food emissions. Legumes, tofu, and vegetables have a fraction of the carbon footprint of beef.',
    category: 'food',
    monthlySaving: 18,
    difficulty: 'Easy',
    action: 'Swap your weekday lunch to a plant-based option on Monday, Wednesday, and Friday.',
  },
  {
    id: 'fallback_2',
    title: 'Use public transit twice a week',
    description: 'Taking the bus or train instead of driving just twice a week can save hundreds of kg of CO₂ annually. Public transit emits 60% less per km than a solo car journey.',
    category: 'transport',
    monthlySaving: 25,
    difficulty: 'Medium',
    action: 'Plan two work commutes by bus or train starting this week.',
  },
  {
    id: 'fallback_3',
    title: 'Lower your thermostat by 2°C',
    description: 'Reducing heating by just 2°C can cut your home energy use by up to 10%. A smart thermostat can automate this and also reduce cooling costs in summer.',
    category: 'energy',
    monthlySaving: 12,
    difficulty: 'Easy',
    action: 'Set your thermostat 2°C lower and add a layer of clothing instead.',
  },
  {
    id: 'fallback_4',
    title: 'Buy second-hand instead of new',
    description: 'The fashion industry produces 10% of global carbon emissions. Buying second-hand extends the life of clothing and avoids the emissions from manufacturing new items.',
    category: 'shopping',
    monthlySaving: 20,
    difficulty: 'Easy',
    action: 'Before buying a new clothing item, check thrift stores or apps like Vinted first.',
  },
  {
    id: 'fallback_5',
    title: 'Switch to an EV or hybrid for next car',
    description: 'Electric vehicles produce up to 70% less CO₂ over their lifetime compared to petrol cars. Even hybrids can cut your transport emissions significantly.',
    category: 'transport',
    monthlySaving: 45,
    difficulty: 'Hard',
    action: 'Research EV models available in your country and check for government incentives.',
  },
];
