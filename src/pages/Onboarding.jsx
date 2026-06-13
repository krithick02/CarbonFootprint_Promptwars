import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Leaf, Globe2, Car, Utensils, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateBaseline } from '../utils/emissions';

const STEPS = [
  { id: 1, label: 'Basics', icon: Globe2 },
  { id: 2, label: 'Transport', icon: Car },
  { id: 3, label: 'Diet', icon: Utensils },
  { id: 4, label: 'Energy', icon: Zap },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'India', 'Germany', 'Australia',
  'Canada', 'France', 'Japan', 'Brazil', 'China', 'Other',
];

const TRANSPORT_MODES = [
  { id: 'car', label: 'Car (Petrol/Diesel)', icon: '🚗', factor: 0.21 },
  { id: 'publicTransit', label: 'Public Transit', icon: '🚌', factor: 0.089 },
  { id: 'bike', label: 'Bike / Walk', icon: '🚴', factor: 0 },
  { id: 'wfh', label: 'Work From Home', icon: '🏠', factor: 0 },
];

const DIET_TYPES = [
  { id: 'vegan', label: 'Vegan', icon: '🥦', desc: 'No animal products', daily: 1.5 },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗', desc: 'No meat, but dairy/eggs', daily: 2.5 },
  { id: 'omnivore', label: 'Omnivore', icon: '🍽️', desc: 'Mixed diet, moderate meat', daily: 4.5 },
  { id: 'heavyMeat', label: 'Heavy Meat Eater', icon: '🥩', desc: 'Meat at most meals', daily: 7.0 },
];

const ENERGY_SOURCES = [
  { id: 'renewable', label: 'Renewable', icon: '☀️', desc: 'Solar, wind, hydro', factor: 0.05 },
  { id: 'mixed', label: 'Mixed Grid', icon: '⚡', desc: 'Partly renewable', factor: 0.233 },
  { id: 'coal', label: 'Coal/Gas Heavy', icon: '🏭', desc: 'Mostly fossil fuels', factor: 0.82 },
];

export default function Onboarding({ onBack }) {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [baseline, setBaseline] = useState(null);

  const [form, setForm] = useState({
    country: '',
    householdSize: 1,
    transport: { primaryMode: 'car', weeklyKm: 100 },
    diet: { type: 'omnivore' },
    energy: { source: 'mixed', monthlyKwh: 300 },
  });

  const updateForm = (path, value) => {
    const keys = path.split('.');
    setForm((prev) => {
      const updated = { ...prev };
      if (keys.length === 1) {
        updated[keys[0]] = value;
      } else {
        updated[keys[0]] = { ...prev[keys[0]], [keys[1]]: value };
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Calculate and show result
      const result = calculateBaseline(form);
      setBaseline(result);
      setShowResult(true);
    }
  };

  const handleSubmit = () => {
    completeOnboarding(form);
    // App.jsx will detect onboardingComplete = true and show MainApp
  };

  if (showResult && baseline) {
    return (
      <div className="min-h-screen bg-[#0C1F16] flex items-center justify-center p-4">
        <div className="max-w-lg w-full animate-scale-in">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mint to-forest mx-auto flex items-center justify-center mb-6 shadow-glow-mint">
              <Leaf size={36} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-3xl text-offwhite mb-2">Your Baseline</h2>
            <p className="text-[rgba(248,249,250,0.55)] mb-8">Here's your estimated annual carbon footprint</p>

            {/* Big number */}
            <div className="mb-8">
              <span className="font-display font-bold text-6xl gradient-text">
                {(baseline.total / 1000).toFixed(2)}
              </span>
              <span className="text-xl text-[rgba(248,249,250,0.5)] ml-2">tonnes CO₂/year</span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {[
                { label: '🚗 Transport', value: baseline.breakdown.transport, color: '#F4A261' },
                { label: '🍽️ Food', value: baseline.breakdown.food, color: '#52B788' },
                { label: '⚡ Energy', value: baseline.breakdown.energy, color: '#4CC9F0' },
                { label: '🛍️ Shopping', value: baseline.breakdown.shopping, color: '#9B5DE5' },
              ].map((cat) => (
                <div
                  key={cat.label}
                  className="p-3 rounded-xl"
                  style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                >
                  <p className="text-xs text-[rgba(248,249,250,0.5)] mb-1">{cat.label}</p>
                  <p className="font-bold text-offwhite">{cat.value} kg</p>
                </div>
              ))}
            </div>

            {/* Comparison */}
            <div className="mb-8 p-4 glass rounded-xl">
              <p className="text-sm text-[rgba(248,249,250,0.55)] mb-3">vs. global benchmarks</p>
              {[
                { label: 'You', value: baseline.total / 1000, color: baseline.total > 4000 ? '#E63946' : '#52B788', max: 12 },
                { label: 'Global avg', value: 4, color: '#F4A261', max: 12 },
                { label: 'Paris target', value: 2, color: '#52B788', max: 12 },
              ].map((b) => (
                <div key={b.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[rgba(248,249,250,0.6)]">{b.label}</span>
                    <span style={{ color: b.color }}>{b.value.toFixed(1)}t</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min((b.value / b.max) * 100, 100)}%`, background: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4">
              Start Tracking <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C1F16] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf size={24} className="text-mint" />
            <span className="font-display font-bold text-2xl gradient-text">EcoTrack Setup</span>
          </div>
          <p className="text-[rgba(248,249,250,0.55)] text-sm">Step {step} of 4 — {STEPS[step - 1].label}</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > s.id
                    ? 'bg-mint text-white'
                    : step === s.id
                    ? 'bg-forest border-2 border-mint text-mint'
                    : 'bg-[rgba(82,183,136,0.1)] text-[rgba(248,249,250,0.3)] border border-[rgba(82,183,136,0.2)]'
                }`}
              >
                {step > s.id ? <Check size={16} /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-10 transition-all duration-500 ${step > s.id ? 'bg-mint' : 'bg-[rgba(82,183,136,0.2)]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="card p-6 md:p-8 animate-scale-in">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-offwhite mb-1">Tell us about yourself</h2>
              <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6">This helps us tailor your carbon baseline accurately.</p>

              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => updateForm('country', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2">
                  Household Size
                  <span className="ml-2 font-bold text-mint">{form.householdSize}</span>
                </label>
                <input
                  type="range" min={1} max={10} value={form.householdSize}
                  onChange={(e) => updateForm('householdSize', Number(e.target.value))}
                  className="w-full accent-mint h-2"
                />
                <div className="flex justify-between text-xs text-[rgba(248,249,250,0.35)] mt-1">
                  <span>1 person</span><span>10 people</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Transport */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-offwhite mb-1">How do you get around?</h2>
              <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6">Transport is often the biggest source of personal emissions.</p>

              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-3">Primary mode of transport</label>
                <div className="grid grid-cols-2 gap-3">
                  {TRANSPORT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateForm('transport.primaryMode', mode.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        form.transport.primaryMode === mode.id
                          ? 'border-mint bg-[rgba(82,183,136,0.15)] text-offwhite'
                          : 'border-[rgba(82,183,136,0.2)] text-[rgba(248,249,250,0.6)] hover:border-[rgba(82,183,136,0.4)]'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{mode.icon}</span>
                      <span className="text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.transport.primaryMode !== 'wfh' && (
                <div>
                  <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2">
                    Weekly distance
                    <span className="ml-2 font-bold text-mint">{form.transport.weeklyKm} km</span>
                  </label>
                  <input
                    type="range" min={0} max={1000} step={10} value={form.transport.weeklyKm}
                    onChange={(e) => updateForm('transport.weeklyKm', Number(e.target.value))}
                    className="w-full accent-mint h-2"
                  />
                  <div className="flex justify-between text-xs text-[rgba(248,249,250,0.35)] mt-1">
                    <span>0 km</span><span>1000 km</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Diet */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-offwhite mb-1">What's your diet like?</h2>
              <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6">Food choices account for up to 35% of your footprint.</p>

              <div className="space-y-3">
                {DIET_TYPES.map((diet) => (
                  <button
                    key={diet.id}
                    onClick={() => updateForm('diet.type', diet.id)}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 text-left transition-all duration-200 ${
                      form.diet.type === diet.id
                        ? 'border-mint bg-[rgba(82,183,136,0.15)]'
                        : 'border-[rgba(82,183,136,0.2)] hover:border-[rgba(82,183,136,0.4)]'
                    }`}
                  >
                    <span className="text-3xl">{diet.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-offwhite">{diet.label}</p>
                      <p className="text-xs text-[rgba(248,249,250,0.5)]">{diet.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-mint">{diet.daily} kg CO₂/day</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Energy */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display font-bold text-2xl text-offwhite mb-1">Home energy usage</h2>
              <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6">Electricity source matters as much as how much you use.</p>

              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-3">Electricity source</label>
                <div className="grid grid-cols-3 gap-3">
                  {ENERGY_SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => updateForm('energy.source', src.id)}
                      className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                        form.energy.source === src.id
                          ? 'border-mint bg-[rgba(82,183,136,0.15)]'
                          : 'border-[rgba(82,183,136,0.2)] hover:border-[rgba(82,183,136,0.4)]'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{src.icon}</span>
                      <span className="text-xs font-medium text-offwhite">{src.label}</span>
                      <span className="text-xs text-[rgba(248,249,250,0.4)] block">{src.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2">
                  Monthly electricity usage
                  <span className="ml-2 font-bold text-mint">{form.energy.monthlyKwh} kWh</span>
                </label>
                <input
                  type="range" min={0} max={2000} step={50} value={form.energy.monthlyKwh}
                  onChange={(e) => updateForm('energy.monthlyKwh', Number(e.target.value))}
                  className="w-full accent-mint h-2"
                />
                <div className="flex justify-between text-xs text-[rgba(248,249,250,0.35)] mt-1">
                  <span>0 kWh</span><span>2000 kWh</span>
                </div>
                <p className="text-xs text-[rgba(248,249,250,0.35)] mt-2">Average household: 250–400 kWh/month</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : (onBack && onBack())}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              {step > 1 ? 'Back' : 'Home'}
            </button>
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              {step === 4 ? 'Calculate' : 'Next'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
