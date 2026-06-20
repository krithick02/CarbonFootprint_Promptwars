import { describe, it, expect } from 'vitest';
import {
  calculateBaseline,
  calculateActivity,
  getDailyTotal,
  getWeeklyTrend,
  getMonthlyCategoryBreakdown,
  calculateStreak,
  formatCO2,
  getCO2Color,
  GREEN_THRESHOLD,
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

  it('includes shopping in breakdown for every profile', () => {
    const profile = {
      householdSize: 1,
      transport: { primaryMode: 'car', weeklyKm: 0 },
    };
    const result = calculateBaseline(profile);
    expect(result.breakdown.shopping).toBeGreaterThan(0);
  });

  it('divides energy by household size', () => {
    const single = calculateBaseline({
      householdSize: 1,
      energy: { source: 'mixed', monthlyKwh: 300 },
    });
    const family = calculateBaseline({
      householdSize: 4,
      energy: { source: 'mixed', monthlyKwh: 300 },
    });
    expect(single.breakdown.energy).toBeGreaterThan(family.breakdown.energy);
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

  it('chicken activity returns positive CO2', () => {
    expect(calculateActivity('chicken', { meals: 1 })).toBeGreaterThan(0);
  });

  it('chicken emits more than vegan but less than beef', () => {
    const chickenCO2 = calculateActivity('chicken', { meals: 1 });
    const beefCO2 = calculateActivity('beef', { meals: 1 });
    const veganCO2 = calculateActivity('vegan', { meals: 1 });
    expect(chickenCO2).toBeGreaterThan(veganCO2);
    expect(chickenCO2).toBeLessThan(beefCO2);
  });

  it('electricity activity returns positive CO2 for non-zero kwh', () => {
    expect(calculateActivity('electricity', { kwh: 100 })).toBeGreaterThan(0);
  });

  it('electricity returns 0 for 0 kwh', () => {
    expect(calculateActivity('electricity', { kwh: 0 })).toBe(0);
  });

  it('clothing activity returns positive CO2', () => {
    expect(calculateActivity('clothing', { items: 1 })).toBeGreaterThan(0);
  });

  it('ac activity returns positive CO2 for non-zero hours', () => {
    expect(calculateActivity('ac', { hours: 5 })).toBeGreaterThan(0);
  });

  it('publicTransit returns positive CO2', () => {
    expect(calculateActivity('publicTransit', { km: 50 })).toBeGreaterThan(0);
  });

  it('publicTransit emits less than car for same distance', () => {
    const transit = calculateActivity('publicTransit', { km: 100 });
    const car = calculateActivity('car', { km: 100 });
    expect(transit).toBeLessThan(car);
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

  it('returns 0 for empty logs array', () => {
    expect(getDailyTotal([], '2026-06-10')).toBe(0);
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

  it('week labels are sequential', () => {
    const result = getWeeklyTrend([], 3);
    expect(result[0].week).toBe('Week 1');
    expect(result[1].week).toBe('Week 2');
    expect(result[2].week).toBe('Week 3');
  });
});

// ─── getMonthlyCategoryBreakdown ─────────────────────────────────────────────
describe('getMonthlyCategoryBreakdown', () => {
  it('returns all 4 categories', () => {
    const result = getMonthlyCategoryBreakdown([], null);
    const names = result.map((c) => c.name);
    expect(names).toContain('transport');
    expect(names).toContain('food');
    expect(names).toContain('energy');
    expect(names).toContain('shopping');
  });

  it('returns all zeros when no logs and no baseline', () => {
    const result = getMonthlyCategoryBreakdown([], null);
    result.forEach((c) => expect(c.value).toBe(0));
  });

  it('uses baseline proportions when no logs but baseline provided', () => {
    const result = getMonthlyCategoryBreakdown([], 12000); // 12000 kg/year = 1000/month
    const transport = result.find((c) => c.name === 'transport');
    const food = result.find((c) => c.name === 'food');
    expect(transport.value).toBeGreaterThan(0);
    expect(food.value).toBeGreaterThan(0);
  });

  it('sums log entries in current month by category', () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = [
      { date: today, category: 'transport', co2: 10 },
      { date: today, category: 'transport', co2: 5 },
      { date: today, category: 'food', co2: 8 },
    ];
    const result = getMonthlyCategoryBreakdown(logs, null);
    const transport = result.find((c) => c.name === 'transport');
    const food = result.find((c) => c.name === 'food');
    expect(transport.value).toBeCloseTo(15);
    expect(food.value).toBeCloseTo(8);
  });

  it('ignores logs from previous months', () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const logs = [{ date: lastMonth.toISOString().split('T')[0], category: 'food', co2: 50 }];
    const result = getMonthlyCategoryBreakdown(logs, null);
    const food = result.find((c) => c.name === 'food');
    expect(food.value).toBe(0);
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
    const logs = [{ date: dateStr, co2: 5 }]; // 5kg < GREEN_THRESHOLD
    expect(calculateStreak(logs)).toBeGreaterThanOrEqual(1);
  });

  it('returns 0 when only day is above threshold', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const logs = [{ date: dateStr, co2: 20 }]; // 20kg > GREEN_THRESHOLD
    expect(calculateStreak(logs)).toBe(0);
  });

  it('counts multiple consecutive green days', () => {
    const logs = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      logs.push({ date: d.toISOString().split('T')[0], co2: 5 });
    }
    expect(calculateStreak(logs)).toBe(3);
  });

  it('stops counting at a high-emission day', () => {
    const logs = [];
    // day 1 ago: green
    const d1 = new Date();
    d1.setDate(d1.getDate() - 1);
    logs.push({ date: d1.toISOString().split('T')[0], co2: 5 });
    // day 2 ago: high
    const d2 = new Date();
    d2.setDate(d2.getDate() - 2);
    logs.push({ date: d2.toISOString().split('T')[0], co2: 25 });
    // day 3 ago: green (should not be counted)
    const d3 = new Date();
    d3.setDate(d3.getDate() - 3);
    logs.push({ date: d3.toISOString().split('T')[0], co2: 5 });

    expect(calculateStreak(logs)).toBe(1);
  });

  it('GREEN_THRESHOLD is exported and is 11', () => {
    expect(GREEN_THRESHOLD).toBe(11);
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

  it('formats 0 as grams', () => {
    expect(formatCO2(0)).toBe('0 g');
  });

  it('formats exactly 1 kg as kg', () => {
    expect(formatCO2(1)).toBe('1.0 kg');
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

  it('uses GREEN_THRESHOLD as default threshold', () => {
    expect(getCO2Color(2)).toBe('#52B788');
    expect(getCO2Color(15)).toBe('#E63946');
  });
});
