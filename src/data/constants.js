// ─── Emission Factors ────────────────────────────────────────────────────────
export const EMISSION_FACTORS = {
  car: 0.21,          // kg CO₂/km (petrol)
  flight: 0.255,      // kg CO₂/km (economy)
  beef: 3.0,          // kg CO₂/meal
  chicken: 0.7,       // kg CO₂/meal
  vegan: 0.3,         // kg CO₂/meal
  electricity: 0.233, // kg CO₂/kWh
  clothing: 10,       // kg CO₂/item
  publicTransit: 0.089, // kg CO₂/km
  bike: 0,            // kg CO₂/km
  ac: 1.2,            // kg CO₂/hr (average AC unit ~1500W)
};

// ─── Diet Factors (kg CO₂/day) ───────────────────────────────────────────────
export const DIET_DAILY = {
  vegan: 1.5,
  vegetarian: 2.5,
  omnivore: 4.5,
  heavyMeat: 7.0,
};

// ─── Energy Source Multipliers ────────────────────────────────────────────────
export const ENERGY_MULTIPLIERS = {
  renewable: 0.05,
  mixed: 0.233,
  coal: 0.82,
};

// ─── Global Benchmarks ───────────────────────────────────────────────────────
export const GLOBAL_BENCHMARKS = {
  globalAverage: 4000,   // kg CO₂/year
  parisTarget: 2000,     // kg CO₂/year
};

// ─── Quick-Add Activities ─────────────────────────────────────────────────────
export const QUICK_ACTIVITIES = [
  {
    id: 'drive_20',
    label: 'Drove 20 km',
    icon: 'Car',
    category: 'transport',
    defaultCo2: 20 * 0.21,
    color: '#F4A261',
    description: 'Petrol car, average distance',
    params: { type: 'car', km: 20 },
  },
  {
    id: 'beef_meal',
    label: 'Ate beef',
    icon: 'Beef',
    category: 'food',
    defaultCo2: 3.0,
    color: '#E63946',
    description: 'One beef-based meal',
    params: { type: 'beef', meals: 1 },
  },
  {
    id: 'flight_100',
    label: 'Took a flight',
    icon: 'Plane',
    category: 'transport',
    defaultCo2: 255,
    color: '#D62828',
    description: '~1000 km economy flight',
    params: { type: 'flight', km: 1000 },
  },
  {
    id: 'clothing_buy',
    label: 'Bought new clothes',
    icon: 'ShoppingBag',
    category: 'shopping',
    defaultCo2: 10,
    color: '#9B5DE5',
    description: 'One new clothing item',
    params: { type: 'clothing', items: 1 },
  },
  {
    id: 'ac_3hr',
    label: 'Used AC 3 hrs',
    icon: 'Wind',
    category: 'energy',
    defaultCo2: 3 * 1.2,
    color: '#4CC9F0',
    description: '3 hours air conditioning',
    params: { type: 'ac', hours: 3 },
  },
  {
    id: 'chicken_meal',
    label: 'Ate chicken',
    icon: 'UtensilsCrossed',
    category: 'food',
    defaultCo2: 0.7,
    color: '#F77F00',
    description: 'One chicken-based meal',
    params: { type: 'chicken', meals: 1 },
  },
  {
    id: 'vegan_meal',
    label: 'Vegan meal',
    icon: 'Leaf',
    category: 'food',
    defaultCo2: 0.3,
    color: '#52B788',
    description: 'One plant-based meal',
    params: { type: 'vegan', meals: 1 },
  },
  {
    id: 'bus_10',
    label: 'Took the bus',
    icon: 'Bus',
    category: 'transport',
    defaultCo2: 10 * 0.089,
    color: '#43AA8B',
    description: '10 km public transit',
    params: { type: 'publicTransit', km: 10 },
  },
];

// ─── Weekly Challenges ────────────────────────────────────────────────────────
export const CHALLENGES = [
  {
    id: 'meat_free_3',
    title: 'Go Meat-Free for 3 Days',
    description: 'Skip meat for 3 days this week — choose plant-based or vegetarian meals.',
    icon: 'Leaf',
    saving: 7.5,
    duration: '3 days',
    difficulty: 'Easy',
    category: 'food',
  },
  {
    id: 'no_car_week',
    title: 'Car-Free Week',
    description: 'Use public transit, bike, or walk instead of your car for 7 days.',
    icon: 'Bike',
    saving: 29.4,
    duration: '7 days',
    difficulty: 'Medium',
    category: 'transport',
  },
  {
    id: 'cold_showers',
    title: 'Cold Shower Challenge',
    description: 'Take cold showers for 5 days to reduce hot water energy usage.',
    icon: 'Droplets',
    saving: 5.0,
    duration: '5 days',
    difficulty: 'Hard',
    category: 'energy',
  },
  {
    id: 'no_fast_fashion',
    title: 'No New Clothes',
    description: 'Avoid buying any new clothing items for the entire week.',
    icon: 'ShoppingBag',
    saving: 10,
    duration: '7 days',
    difficulty: 'Easy',
    category: 'shopping',
  },
  {
    id: 'lights_out',
    title: 'Lights-Out Hours',
    description: 'Turn off all lights and unplug devices for 3 hours each day.',
    icon: 'Zap',
    saving: 3.5,
    duration: '7 days',
    difficulty: 'Easy',
    category: 'energy',
  },
];

// ─── Badges ───────────────────────────────────────────────────────────────────
export const BADGES = [
  {
    id: 'first_log',
    title: 'First Step',
    description: 'Logged your first activity',
    icon: '🌱',
    criteria: (state) => state.dailyLogs.length >= 1,
  },
  {
    id: 'green_week',
    title: 'First Green Week',
    description: '7 consecutive days below average',
    icon: '🌿',
    criteria: (state) => state.streak >= 7,
  },
  {
    id: 'flight_free',
    title: 'Flight-Free Month',
    description: '30 days without logging a flight',
    icon: '✈️',
    criteria: (state) => {
      const month = new Date();
      month.setDate(1);
      const flightsThisMonth = state.dailyLogs.filter(
        l => l.category === 'transport' && l.type === 'flight' && new Date(l.date) >= month
      );
      return flightsThisMonth.length === 0 && state.dailyLogs.length > 5;
    },
  },
  {
    id: 'plant_powered',
    title: 'Plant Powered',
    description: 'Logged 10 vegan meals',
    icon: '🥦',
    criteria: (state) => state.dailyLogs.filter(l => l.type === 'vegan').length >= 10,
  },
  {
    id: 'carbon_conscious',
    title: 'Carbon Conscious',
    description: 'Used the app for 5+ days',
    icon: '♻️',
    criteria: (state) => {
      const uniqueDays = new Set(state.dailyLogs.map(l => l.date)).size;
      return uniqueDays >= 5;
    },
  },
  {
    id: 'action_hero',
    title: 'Action Hero',
    description: 'Committed to 3 reduction actions',
    icon: '🦸',
    criteria: (state) => state.committedActions.length >= 3,
  },
  {
    id: 'streak_30',
    title: 'Month of Green',
    description: '30-day logging streak',
    icon: '🏆',
    criteria: (state) => state.streak >= 30,
  },
];

// ─── Category Colors ──────────────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  transport: '#F4A261',
  food: '#52B788',
  energy: '#4CC9F0',
  shopping: '#9B5DE5',
};

export const CATEGORY_LABELS = {
  transport: 'Transport',
  food: 'Food',
  energy: 'Energy',
  shopping: 'Shopping',
};
