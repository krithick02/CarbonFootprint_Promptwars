# 🌿 EcoTrack — AI-Powered Carbon Footprint Tracker

> **PromptWars Submission** — Built with React + Vite + Gemini AI

[![Live App](https://img.shields.io/badge/Live-EcoTrack-52B788?style=for-the-badge&logo=react)](http://localhost:5173)
[![Tests](https://img.shields.io/badge/Tests-36%20Passing-52B788?style=for-the-badge&logo=vitest)](./src/utils/)
[![Lint](https://img.shields.io/badge/ESLint-0%20Errors-52B788?style=for-the-badge&logo=eslint)](./eslint.config.js)

---

## 🎯 Chosen Vertical

**Personal Sustainability & Climate Action**

EcoTrack is a personal carbon footprint tracker that helps individuals understand, log, and actively reduce their daily CO₂ emissions. The vertical targets the growing awareness of individual climate responsibility — bridging the gap between abstract global statistics and actionable daily choices.

The app targets:
- Urban commuters who want to quantify the impact of their transport choices
- Eco-conscious households tracking home energy consumption
- Anyone who wants to turn sustainability intentions into measurable habits

---

## 🧠 Approach & Logic

### Core Philosophy
Rather than overwhelming users with raw data, EcoTrack follows a **measure → understand → act** loop:

1. **Measure** — Users log daily activities (driving, meals, energy use, shopping)
2. **Understand** — AI-powered insights explain what those numbers mean in real-world terms
3. **Act** — Personalized tips, challenges, and committed actions drive behaviour change

### Scoring Architecture

Carbon footprint is calculated across **4 categories**, each with science-backed emission factors:

| Category | Factors Used |
|---|---|
| 🚗 Transport | kg CO₂ per km by mode (car, transit, flight, bike) |
| 🍽 Food | kg CO₂ per meal-day by diet type (meat-heavy → vegan) |
| ⚡ Energy | kg CO₂ per kWh by energy source (coal → solar) |
| 🛍 Shopping | kg CO₂ per clothing item purchased |

**Baseline** is computed during onboarding from household size, primary transport, diet type, and energy source. Daily logs then track actual behaviour against this baseline.

### AI Integration (Dual Provider)
The app supports **two AI providers**, switchable from Settings:
- **Google Gemini 1.5** (default) — via `@google/generative-ai` SDK
- **Anthropic Claude 3.5** — via `@anthropic-ai/sdk`

AI is used to generate:
- Contextual sustainability tips based on the user's actual footprint
- Weekly insight summaries explaining trends
- Trip-based carbon estimates via the Trip Planner

### Google Maps Integration
The **Trip Planner** uses `@googlemaps/js-api-loader` with the Places & Distance Matrix APIs to:
- Autocomplete travel destinations
- Calculate real route distances
- Convert those distances into CO₂ estimates by transport mode

---

## ⚙️ How the Solution Works

### Architecture

```
src/
├── context/
│   └── AppContext.jsx      # Global state (useReducer + localStorage persistence)
├── pages/
│   ├── Landing.jsx         # Hero landing page with particle animation
│   ├── Onboarding.jsx      # 4-step profile wizard
│   └── MainApp.jsx         # Main dashboard shell with scroll-spy nav
├── components/
│   ├── layout/
│   │   └── Navbar.jsx      # Responsive sidebar + mobile top bar
│   ├── dashboard/
│   │   ├── Dashboard.jsx   # Stats cards, gauge chart, category breakdown
│   │   ├── GaugeChart.jsx  # SVG arc gauge for monthly footprint
│   │   └── HeatmapCalendar.jsx  # GitHub-style daily activity heatmap
│   ├── log/
│   │   └── DailyLog.jsx    # Activity logging with 10+ emission types
│   ├── insights/
│   │   ├── Insights.jsx    # AI-generated tips + challenge cards
│   │   └── TripPlanner.jsx # Google Maps powered trip carbon estimator
│   └── progress/
│       ├── Progress.jsx    # Trend charts (Recharts) + streak tracker
│       └── BadgeCard.jsx   # Gamification badges earned by milestones
└── utils/
    ├── emissions.js        # All CO₂ calculation logic (JSDoc documented)
    ├── storage.js          # localStorage persistence layer
    ├── emissions.test.js   # 26 unit tests
    └── storage.test.js     # 10 unit tests
```

### State Management
A single `useReducer` in `AppContext.jsx` manages all app state with 12 action types. State is automatically persisted to `localStorage` on every change, so the app fully restores across page reloads with no backend required.

### Code Splitting
Pages are loaded lazily via `React.lazy` + `Suspense`, and vendor libraries are split into separate cached chunks:

```
Landing.js    →  2.7 KB  (loaded on first visit)
Onboarding.js →  3.3 KB  (loaded only when user starts)
MainApp.js    → 19.6 KB  (loaded after onboarding)
vendor-react  → 56.5 KB  (cached separately)
vendor-charts → 109 KB   (cached separately)
```

### Gamification System
- **Streak counter** — tracks consecutive green days (below 11 kg CO₂/day)
- **Heatmap calendar** — 12-week GitHub-style activity heatmap
- **8 Badges** — unlocked by milestones (first log, 7-day streak, trip planned, etc.)
- **Weekly trend chart** — Recharts area chart with 4-week comparison
- **Committed actions** — users "commit" to tips which accumulate into projected monthly savings

---

## 📐 Assumptions Made

1. **No backend / auth required** — All data is stored in `localStorage`. This was a deliberate choice for simplicity and offline-first usage. A production version would use a database with user accounts.

2. **API keys are user-supplied** — Gemini, Claude, and Google Maps keys are entered by the user via the Settings panel and stored in `localStorage`. This avoids exposing keys in the bundle.

3. **Emission factors are static averages** — The CO₂ factors used (e.g. `0.192 kg/km` for car) are global averages sourced from peer-reviewed datasets (IPCC, IEA). They don't account for regional grid mix or vehicle efficiency.

4. **Daily green threshold = 11 kg CO₂/day** — Based on the global average annual footprint of ~4,000 kg ÷ 365 days. This is used for streak calculation and heatmap coloring.

5. **Diet type approximations** — Daily kg CO₂ per diet type (meatHeavy: 7.5, omnivore: 5.0, pescatarian: 3.5, vegetarian: 2.5, vegan: 1.5) are sourced from Oxford University's food systems research.

6. **Shopping baseline** — A default baseline of 2 clothing items/month is assumed if no shopping logs exist. This is a conservative estimate that can be overridden by daily logs.

7. **Single-person-equivalent energy** — Monthly kWh is divided by household size to get per-person energy consumption for the baseline calculation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- (Optional) A Gemini API key from [aistudio.google.com](https://aistudio.google.com) (free tier available)
- (Optional) A Google Maps API key with Places + Distance Matrix APIs enabled
- (Optional) An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/krithick02/CarbonFootprint_Promptwars.git
cd CarbonFootprint_Promptwars
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v3 + Vanilla CSS (glassmorphism) |
| State | React Context + useReducer |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| AI (primary) | Google Gemini 1.5 (`@google/generative-ai`) |
| AI (secondary) | Anthropic Claude 3.5 (`@anthropic-ai/sdk`) |
| Maps | Google Maps JS API (`@googlemaps/js-api-loader`) |
| Testing | Vitest |
| Linting | ESLint 10 (flat config) |
| Persistence | localStorage (no backend) |

---

## 📊 Quality Metrics

| Metric | Result |
|---|---|
| ESLint errors | **0** |
| Unit tests | **36 / 36 passing** |
| Production build | **✅ Success** |
| Accessibility | ARIA labels, `role="dialog"`, `aria-current`, `:focus-visible` |
| Security | Content Security Policy meta tag |
| Performance | Code split — initial JS **12.5 KB** (gzip: 5.1 KB) |
