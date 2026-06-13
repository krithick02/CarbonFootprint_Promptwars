import { describe, it, expect } from 'vitest';
import {
  calculateBaseline,
  calculateActivity,
  getDailyTotal,
  getWeeklyTrend,
  calculateStreak,
  formatCO2,
  getCO2Color,
} from './emissions.js';

// ─── calculateBaseline ───────────────────────────────────────────────────────
describe('calculateBaseline', () => {
  it('returns zero for null profile', () => {
    expect(calculateBaseline(null)).toBe(0);
  });

  it('returns an object with total and breakdown', () => {
    const profile = {
      householdSize: 2,
      transport: { primaryMode: 'car', weeklyKm: 100 },
      diet: { type: 'omnivore' },
      energy: { source: 'mixed', monthlyKwh: 300 },
    };
    const result = calculateBaseline(profile);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('transport');
    expect(result.breakdown).toHaveProperty('food');
    expect(result.breakdown).toHaveProperty('energy');
    expect(result.breakdown).toHaveProperty('shopping');
  });

  it('calculates higher footprint for car vs public transit', () => {
    const carProfile = {
      householdSize: 1,
      transport: { primaryMode: 'car', weeklyKm: 100 },
      diet: { type: 'omnivore' },
      energy: { source: 'mixed', monthlyKwh: 300 },
    };
    const transitProfile = {
      ...carProfile,
      transport: { primaryMode: 'publicTransit', weeklyKm: 100 },
    };
    expect(calculateBaseline(carProfile).total).toBeGreaterThan(
      calculateBaseline(transitProfile).total
    );
  });

  it('calculates higher footprint for meat-heavy diet vs vegan', () => {
    const base = {
      householdSize: 1,
      transport: { primaryMode: 'car', weeklyKm: 50 },
      energy: { source: 'mixed', monthlyKwh: 200 },
    };
    const meatEater = calculateBaseline({ ...base, diet: { type: 'meatHeavy' } });
    const vegan = calculateBaseline({ ...base, diet: { type: 'vegan' } });
    expect(meatEater.total).toBeGreaterThan(vegan.total);
  });

  it('returns rounded integers', () => {
    const profile = {
      householdSize: 1,
      transport: { primaryMode: 'car', weeklyKm: 75 },
      diet: { type: 'omnivore' },
      energy: { source: 'mixed', monthlyKwh: 250 },
    };
    const result = calculateBaseline(profile);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

// ─── calculateActivity ───────────────────────────────────────────────────────
describe('calculateActivity', () => {
  it('returns 0 for bike activity', () => {
    expect(calculateActivity('bike', { km: 50 })).toBe(0);
  });

  it('returns positive CO2 for car activity', () => {
    expect(calculateActivity('car', { km: 100 })).toBeGreaterThan(0);
  });

  it('returns positive CO2 for flight', () => {
    expect(calculateActivity('flight', { km: 1000 })).toBeGreaterThan(0);
  });

  it('flight emits more per km than car', () => {
    const flightCO2 = calculateActivity('flight', { km: 100 });
    const carCO2 = calculateActivity('car', { km: 100 });
    expect(flightCO2).toBeGreaterThan(carCO2);
  });

  it('returns 0 km → 0 CO2 for car', () => {
    expect(calculateActivity('car', { km: 0 })).toBe(0);
  });

  it('defaults unknown type to params.co2 or 0', () => {
    expect(calculateActivity('unknown', {})).toBe(0);
    expect(calculateActivity('unknown', { co2: 5 })).toBe(5);
  });

  it('beef emits more than vegan meal', () => {
    const beefCO2 = calculateActivity('beef', { meals: 1 });
    const veganCO2 = calculateActivity('vegan', { meals: 1 });
    expect(beefCO2).toBeGreaterThan(veganCO2);
  });
});

// ─── getDailyTotal ───────────────────────────────────────────────────────────
describe('getDailyTotal', () => {
  const logs = [
    { date: '2026-06-10', co2: 5.5 },
    { date: '2026-06-10', co2: 3.0 },
    { date: '2026-06-11', co2: 7.0 },
  ];

  it('sums all entries for a given date', () => {
    expect(getDailyTotal(logs, '2026-06-10')).toBeCloseTo(8.5);
  });

  it('returns 0 for a date with no logs', () => {
    expect(getDailyTotal(logs, '2026-06-09')).toBe(0);
  });

  it('handles Date object input', () => {
    expect(getDailyTotal(logs, new Date('2026-06-11'))).toBeCloseTo(7.0);
  });
});

// ─── getWeeklyTrend ──────────────────────────────────────────────────────────
describe('getWeeklyTrend', () => {
  it('returns correct number of weeks', () => {
    const result = getWeeklyTrend([], 4);
    expect(result).toHaveLength(4);
  });

  it('each item has week label and total', () => {
    const result = getWeeklyTrend([], 2);
    result.forEach((item) => {
      expect(item).toHaveProperty('week');
      expect(item).toHaveProperty('total');
    });
  });

  it('returns zero totals for empty logs', () => {
    const result = getWeeklyTrend([], 3);
    result.forEach((item) => expect(item.total).toBe(0));
  });
});

// ─── calculateStreak ─────────────────────────────────────────────────────────
describe('calculateStreak', () => {
  it('returns 0 for empty logs', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns positive streak for green-day logs', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const logs = [{ date: dateStr, co2: 5 }]; // 5kg < 11kg threshold
    expect(calculateStreak(logs)).toBeGreaterThanOrEqual(1);
  });
});

// ─── formatCO2 ───────────────────────────────────────────────────────────────
describe('formatCO2', () => {
  it('formats grams for values < 1 kg', () => {
    expect(formatCO2(0.5)).toBe('500 g');
  });

  it('formats kg for values 1–999 kg', () => {
    expect(formatCO2(5.678)).toBe('5.7 kg');
  });

  it('formats tonnes for values >= 1000 kg', () => {
    expect(formatCO2(1500)).toBe('1.50 t');
  });
});

// ─── getCO2Color ─────────────────────────────────────────────────────────────
describe('getCO2Color', () => {
  it('returns green for low emissions', () => {
    expect(getCO2Color(2, 11)).toBe('#52B788');
  });

  it('returns amber for medium emissions', () => {
    expect(getCO2Color(8, 11)).toBe('#F4A261');
  });

  it('returns red for high emissions', () => {
    expect(getCO2Color(15, 11)).toBe('#E63946');
  });
});
