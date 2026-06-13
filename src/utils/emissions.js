import { EMISSION_FACTORS, DIET_DAILY, ENERGY_MULTIPLIERS } from '../data/constants';

/**
 * Calculate annual baseline CO₂ in kg from onboarding profile
 */
export function calculateBaseline(profile) {
  if (!profile) return 0;

  const { householdSize = 1, transport, diet, energy } = profile;

  // ─── Transport ─────────────────────────────────────────────────────────────
  let transportAnnual = 0;
  if (transport) {
    const weeklyKm = parseFloat(transport.weeklyKm) || 0;
    const mode = transport.primaryMode;
    const factor = EMISSION_FACTORS[mode] ?? EMISSION_FACTORS.publicTransit;
    transportAnnual = weeklyKm * factor * 52; // kg/year
  }

  // ─── Diet ──────────────────────────────────────────────────────────────────
  let dietAnnual = 0;
  if (diet) {
    const dailyKg = DIET_DAILY[diet.type] ?? DIET_DAILY.omnivore;
    dietAnnual = dailyKg * 365;
  }

  // ─── Home Energy ───────────────────────────────────────────────────────────
  let energyAnnual = 0;
  if (energy) {
    const monthlyKwh = parseFloat(energy.monthlyKwh) || 0;
    const factor = ENERGY_MULTIPLIERS[energy.source] ?? ENERGY_MULTIPLIERS.mixed;
    energyAnnual = (monthlyKwh / (householdSize || 1)) * factor * 12;
  }

  // ─── Shopping (baseline estimate: ~2 items/month) ──────────────────────────
  const shoppingAnnual = 2 * 12 * EMISSION_FACTORS.clothing;

  const total = transportAnnual + dietAnnual + energyAnnual + shoppingAnnual;

  return {
    total: Math.round(total),
    breakdown: {
      transport: Math.round(transportAnnual),
      food: Math.round(dietAnnual),
      energy: Math.round(energyAnnual),
      shopping: Math.round(shoppingAnnual),
    },
  };
}

/**
 * Calculate CO₂ for a single activity log entry (in kg)
 */
export function calculateActivity(type, params = {}) {
  switch (type) {
    case 'car':
      return (params.km || 0) * EMISSION_FACTORS.car;
    case 'publicTransit':
      return (params.km || 0) * EMISSION_FACTORS.publicTransit;
    case 'bike':
      return 0;
    case 'flight':
      return (params.km || 0) * EMISSION_FACTORS.flight;
    case 'beef':
      return (params.meals || 1) * EMISSION_FACTORS.beef;
    case 'chicken':
      return (params.meals || 1) * EMISSION_FACTORS.chicken;
    case 'vegan':
      return (params.meals || 1) * EMISSION_FACTORS.vegan;
    case 'electricity':
      return (params.kwh || 0) * EMISSION_FACTORS.electricity;
    case 'clothing':
      return (params.items || 1) * EMISSION_FACTORS.clothing;
    case 'ac':
      return (params.hours || 0) * EMISSION_FACTORS.ac;
    default:
      return params.co2 || 0;
  }
}

/**
 * Get total CO₂ for a specific date from logs array
 */
export function getDailyTotal(logs, date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return logs
    .filter((l) => l.date === dateStr)
    .reduce((sum, l) => sum + (l.co2 || 0), 0);
}

/**
 * Get last N weeks of daily totals
 */
export function getWeeklyTrend(logs, weeks = 4) {
  const result = [];
  const today = new Date();

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - w * 7 - today.getDay());
    
    let weekTotal = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      weekTotal += getDailyTotal(logs, day.toISOString().split('T')[0]);
    }

    result.push({
      week: `Week ${weeks - w}`,
      total: Math.round(weekTotal * 10) / 10,
    });
  }
  return result;
}

/**
 * Get category breakdown from logs for a given month
 */
export function getMonthlyCategoryBreakdown(logs, baseline) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const categories = { transport: 0, food: 0, energy: 0, shopping: 0 };

  logs
    .filter((l) => new Date(l.date) >= monthStart)
    .forEach((l) => {
      const cat = l.category || 'transport';
      categories[cat] = (categories[cat] || 0) + (l.co2 || 0);
    });

  // Add baseline proportional amounts if no logs yet
  const hasLogs = Object.values(categories).some((v) => v > 0);
  if (!hasLogs && baseline) {
    const monthlyBaseline = baseline / 12;
    // Estimate proportion based on typical split
    categories.transport = Math.round(monthlyBaseline * 0.35);
    categories.food = Math.round(monthlyBaseline * 0.35);
    categories.energy = Math.round(monthlyBaseline * 0.2);
    categories.shopping = Math.round(monthlyBaseline * 0.1);
  }

  return Object.entries(categories).map(([name, value]) => ({ name, value }));
}

/**
 * Calculate current streak of green days (below global average daily: 4000/365 ≈ 11 kg/day)
 */
export function calculateStreak(logs) {
  const GREEN_THRESHOLD = 11; // kg CO₂/day
  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTotal = getDailyTotal(logs, dateStr);

    if (i === 0 && dayTotal === 0) continue; // skip today if no logs yet

    if (dayTotal > 0 && dayTotal <= GREEN_THRESHOLD) {
      streak++;
    } else if (dayTotal > GREEN_THRESHOLD) {
      break;
    } else if (dayTotal === 0 && i > 0) {
      break;
    }
  }

  return streak;
}

/**
 * Format kg CO₂ nicely
 */
export function formatCO2(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  if (kg >= 1) return `${kg.toFixed(1)} kg`;
  return `${(kg * 1000).toFixed(0)} g`;
}

/**
 * Get color based on CO₂ intensity
 */
export function getCO2Color(kg, threshold = 11) {
  const ratio = kg / threshold;
  if (ratio <= 0.5) return '#52B788';
  if (ratio <= 1) return '#F4A261';
  return '#E63946';
}
