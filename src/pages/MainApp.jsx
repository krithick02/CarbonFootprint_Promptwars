import { useState, useEffect, useRef } from 'react';
import { TrendingUp as TrendingUpIcon, Calendar, Flame, Trash2, PlusCircle, CheckCircle2, ChevronRight, Sparkles, Globe, Target, RefreshCw, Key, ChevronLeft, TrendingDown, Award } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

import Navbar from '../components/layout/Navbar';
import GaugeChart from '../components/charts/GaugeChart';
import HeatmapCalendar from '../components/charts/HeatmapCalendar';
import ActivityCard from '../components/cards/ActivityCard';
import TipCard from '../components/cards/TipCard';
import BadgeCard from '../components/cards/BadgeCard';
import TripPlanner from '../components/log/TripPlanner';
import { CustomTooltip, LineTooltip, SavingsTooltip } from '../components/charts/Tooltips';

import { useApp } from '../context/AppContext';
import { QUICK_ACTIVITIES, CATEGORY_COLORS, CATEGORY_LABELS, GLOBAL_BENCHMARKS, CHALLENGES, BADGES } from '../data/constants';
import { generateTips, FALLBACK_TIPS } from '../utils/claude';
import { generateTipsGemini } from '../utils/gemini';

// ─── Log icon map ─────────────────────────────────────────────────────────────
/** Maps Lucide icon name strings to emoji equivalents for log entries. */
const LOG_ICON_MAP = {
  Car: '🚗',
  Beef: '🥩',
  Plane: '✈️',
  ShoppingBag: '🛍️',
  Wind: '❄️',
  Leaf: '🥦',
  UtensilsCrossed: '🍗',
};

/** Returns the emoji for a log icon name, falling back to a bus emoji. */
function getLogEmoji(iconName) {
  return LOG_ICON_MAP[iconName] ?? '🚌';
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, children }) {
  return (
    <section id={id} className="min-h-screen py-10 scroll-mt-16 md:scroll-mt-0">
      {children}
    </section>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-10 h-10 rounded-xl bg-[rgba(82,183,136,0.15)] border border-[rgba(82,183,136,0.25)] flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-[#52B788]" />
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl text-offwhite">{title}</h2>
        {subtitle && <p className="text-sm text-[rgba(248,249,250,0.45)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-[rgba(82,183,136,0.2)] to-transparent ml-2" />
    </div>
  );
}

export default function MainApp() {
  const {
    monthlyFootprint, categoryBreakdown, weeklyTrend,
    streak, baseline, dailyLogs, addLog, removeLog,
    committedActions, commitAction, uncommitAction,
    completedChallenges, completeChallenge, profile,
    badges, totalSavings, apiKey, geminiKey, aiProvider,
  } = useApp();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [logTab, setLogTab] = useState('quick'); // 'quick' | 'plan'
  const [logFilter, setLogFilter] = useState('all');
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState(null);
  const [tipsGenerated, setTipsGenerated] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const scrollLockRef = useRef(false);

  // Scroll-position based active section tracking (more reliable than IntersectionObserver)
  useEffect(() => {
    const SECTIONS = ['dashboard', 'log', 'insights', 'progress'];
    const OFFSET = 120; // px from top of viewport to consider a section "active"

    const handleScroll = () => {
      if (scrollLockRef.current) return; // ignore during programmatic scrolls
      let current = SECTIONS[0];
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= OFFSET) current = id;
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to section and temporarily lock the scroll observer
  const scrollTo = (id) => {
    setActiveSection(id); // immediately highlight the clicked nav item
    scrollLockRef.current = true;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // release lock after scroll animation completes (~800ms)
    setTimeout(() => { scrollLockRef.current = false; }, 900);
  };

  // ─── Daily Log ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = dailyLogs.filter((l) => l.date === today);
  const todayTotal = todayLogs.reduce((s, l) => s + l.co2, 0);

  const handleConfirm = (activity) => {
    addLog({
      type: activity.params.type,
      category: activity.category,
      co2: activity.defaultCo2,
      label: activity.label,
      icon: activity.icon,
      color: activity.color,
    });
  };

  const filteredActivities = logFilter === 'all'
    ? QUICK_ACTIVITIES
    : QUICK_ACTIVITIES.filter((a) => a.category === logFilter);

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  const monthlyTarget = GLOBAL_BENCHMARKS.parisTarget / 12;
  const globalMonthly = GLOBAL_BENCHMARKS.globalAverage / 12;
  const pieData = categoryBreakdown
    .filter((c) => c.value > 0)
    .map((c) => ({ ...c, name: CATEGORY_LABELS[c.name] || c.name, fill: CATEGORY_COLORS[c.name] || '#52B788' }));

  // ─── Insights ──────────────────────────────────────────────────────────────
  const topCategories = [...categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 3);

  const handleGenerateTips = async () => {
    setTipsLoading(true);
    setTipsError(null);
    try {
      let result;
      if (aiProvider === 'gemini') {
        result = await generateTipsGemini({ profile, baseline, topCategories, geminiKey });
      } else {
        result = await generateTips({ profile, baseline, topCategories, apiKey });
      }
      setTips(result);
      setTipsGenerated(true);
    } catch (err) {
      setTipsError(err.message === 'NO_API_KEY' ? 'no_key' : err.message === 'INVALID_API_KEY' ? 'invalid_key' : 'generic');
      setTips(FALLBACK_TIPS);
      setTipsGenerated(true);
    } finally {
      setTipsLoading(false);
    }
  };

  const isCommitted = (tipId) => committedActions.some((a) => a.tipId === tipId);

  // ─── Progress ──────────────────────────────────────────────────────────────
  const uniqueDays = new Set(dailyLogs.map((l) => l.date)).size;
  const totalLogged = dailyLogs.reduce((s, l) => s + l.co2, 0);

  const savingsData = (() => {
    if (committedActions.length === 0) return [];
    const sorted = [...committedActions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    return sorted.map((action, i) => {
      cumulative += action.saving || 0;
      return { name: `Action ${i + 1}`, label: (action.title || '').slice(0, 18), cumulative: Math.round(cumulative) };
    });
  })();

  const getImpact = (co2) => {
    if (co2 <= 11) return { label: 'Low Impact Day 🌿', color: '#52B788' };
    if (co2 <= 22) return { label: 'Moderate Day ⚡', color: '#F4A261' };
    return { label: 'High Impact Day 🔥', color: '#E63946' };
  };
  const impact = getImpact(todayTotal);

  const prevCal = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextCal = () => {
    const now = new Date();
    if (calYear === now.getFullYear() && calMonth === now.getMonth()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  return (
    <div className="flex min-h-screen bg-[#0C1F16]">
      <Navbar activeSection={activeSection} scrollTo={scrollTo} />

      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="px-4 md:px-8 max-w-6xl mx-auto">

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: DASHBOARD
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="dashboard">
            <SectionDivider
              title="Dashboard"
              subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              icon={LucideIcons.LayoutDashboard}
            />

            {/* Top row */}
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {/* Gauge */}
              <div className="card p-6 flex flex-col items-center">
                <p className="font-semibold text-offwhite mb-4 w-full text-sm">Monthly Footprint</p>
                <GaugeChart value={monthlyFootprint} max={500} size={200} />
              </div>

              {/* Stats */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: 'vs. Global Avg', value: `${globalMonthly > 0 ? ((monthlyFootprint / globalMonthly) * 100).toFixed(0) : '—'}%`, sub: `${globalMonthly.toFixed(0)} kg avg/mo`, color: '#F4A261' },
                  { icon: TrendingUpIcon, label: 'Paris Target', value: `${monthlyTarget.toFixed(0)} kg`, sub: monthlyFootprint <= monthlyTarget ? '✓ On target!' : `${(monthlyFootprint - monthlyTarget).toFixed(0)} kg over`, color: monthlyFootprint <= monthlyTarget ? '#52B788' : '#E63946' },
                  { icon: Flame, label: 'Green Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, sub: streak > 0 ? '🔥 Keep it up!' : 'Log a green day', color: '#F4A261' },
                  { icon: PlusCircle, label: "Today's Total", value: `${todayTotal.toFixed(1)} kg`, sub: todayTotal === 0 ? 'Nothing yet' : 'CO₂ today', color: '#4CC9F0' },
                ].map((s) => (
                  <div key={s.label} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}22` }}>
                        <s.icon size={16} style={{ color: s.color }} />
                      </div>
                      <span className="text-xs text-[rgba(248,249,250,0.5)]">{s.label}</span>
                    </div>
                    <p className="font-display font-bold text-2xl text-offwhite">{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: s.color }}>{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              {/* Donut */}
              <div className="card p-6">
                <p className="font-semibold text-offwhite mb-4 text-sm">Category Breakdown</p>
                {pieData.length > 0 ? (
                  <div className="flex items-center gap-5">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value">
                          {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2.5">
                      {pieData.map((e) => (
                        <div key={e.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 text-[rgba(248,249,250,0.7)]">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.fill }} />
                              {e.name}
                            </span>
                            <span className="font-semibold text-offwhite">{e.value} kg</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar-fill"
                              role="progressbar"
                              aria-valuenow={monthlyFootprint > 0 ? Math.round((e.value / monthlyFootprint) * 100) : 0}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${e.name} share`}
                              style={{ width: `${monthlyFootprint > 0 ? (e.value / monthlyFootprint) * 100 : 0}%`, background: e.fill }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-[rgba(248,249,250,0.3)] text-sm text-center">
                    Log activities to see your breakdown
                  </div>
                )}
              </div>

              {/* Line chart */}
              <div className="card p-6">
                <p className="font-semibold text-offwhite mb-4 text-sm">Weekly Trend</p>
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.1)" />
                    <XAxis dataKey="week" tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<LineTooltip />} />
                    <Line type="monotone" dataKey="total" stroke="#52B788" strokeWidth={2.5} dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#74C69D' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison bar */}
            <div className="card p-6">
              <p className="font-semibold text-offwhite mb-4 text-sm">Your Footprint vs. Global Benchmarks</p>
              <div className="space-y-4">
                {[
                  { label: 'You (this month)', value: monthlyFootprint, annual: monthlyFootprint * 12, color: monthlyFootprint > globalMonthly ? '#E63946' : '#52B788' },
                  { label: 'Global Average', value: globalMonthly, annual: GLOBAL_BENCHMARKS.globalAverage, color: '#F4A261' },
                  { label: 'Paris Target', value: monthlyTarget, annual: GLOBAL_BENCHMARKS.parisTarget, color: '#52B788' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[rgba(248,249,250,0.7)]">{bar.label}</span>
                      <div className="flex gap-3">
                        <span className="font-semibold" style={{ color: bar.color }}>{bar.value.toFixed(0)} kg/mo</span>
                        <span className="text-[rgba(248,249,250,0.4)] text-xs self-center">{(bar.annual / 1000).toFixed(1)}t/yr</span>
                      </div>
                    </div>
                    <div className="progress-bar h-3">
                      <div className="progress-bar-fill h-full rounded-full"
                        role="progressbar"
                        aria-valuenow={Math.round(Math.min((bar.value / 700) * 100, 100))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${bar.label}: ${bar.value.toFixed(0)} kg per month`}
                        style={{ width: `${Math.min((bar.value / 700) * 100, 100)}%`, background: bar.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: DAILY LOG
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="log">
            <SectionDivider title="Daily Log" subtitle="Track your activities and see their CO₂ impact in real time" icon={LucideIcons.BookOpen} />

            {/* Today's total */}
            <div className="card p-5 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[rgba(248,249,250,0.45)] mb-1 flex items-center gap-1.5">
                  <Calendar size={12} /> Today's Total
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-5xl" style={{ color: impact.color }}>{todayTotal.toFixed(1)}</span>
                  <span className="text-lg text-[rgba(248,249,250,0.5)]">kg CO₂</span>
                </div>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${impact.color}22`, color: impact.color, border: `1px solid ${impact.color}44` }}>
                  {impact.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-[rgba(248,249,250,0.35)]">{todayLogs.length} activities</p>
                <p className="text-xs text-[rgba(248,249,250,0.35)] mt-2">Daily target</p>
                <p className="text-sm font-semibold text-[#52B788]">≤ 11 kg</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-4 border-b border-[rgba(248,249,250,0.1)]">
                  <button 
                    onClick={() => setLogTab('quick')}
                    className={`pb-2 text-sm font-semibold transition-all border-b-2 ${logTab === 'quick' ? 'border-[#52B788] text-[#52B788]' : 'border-transparent text-[rgba(248,249,250,0.5)] hover:text-offwhite'}`}
                  >
                    Quick Add
                  </button>
                  <button 
                    onClick={() => setLogTab('plan')}
                    className={`pb-2 text-sm font-semibold transition-all border-b-2 ${logTab === 'plan' ? 'border-[#52B788] text-[#52B788]' : 'border-transparent text-[rgba(248,249,250,0.5)] hover:text-offwhite'}`}
                  >
                    Plan a Trip
                  </button>
                </div>
                
                {logTab === 'quick' ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-[rgba(248,249,250,0.5)] text-xs">Categories</p>
                      <div className="flex gap-1 flex-wrap">
                        {['all', 'transport', 'food', 'energy', 'shopping'].map((cat) => (
                          <button key={cat} onClick={() => setLogFilter(cat)}
                            aria-pressed={logFilter === cat}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${logFilter === cat ? 'bg-[#52B788] text-white' : 'text-[rgba(248,249,250,0.5)] border border-[rgba(82,183,136,0.2)] hover:text-[#52B788]'}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredActivities.map((a) => <ActivityCard key={a.id} activity={a} onConfirm={handleConfirm} />)}
                    </div>
                  </>
                ) : (
                  <TripPlanner />
                )}
              </div>

              {/* Today's entries */}
              <div>
                <p className="font-semibold text-offwhite mb-4 text-sm">Today's Entries</p>
                {todayLogs.length === 0 ? (
                  <div className="card p-6 text-center">
                    <PlusCircle size={28} className="text-[rgba(82,183,136,0.3)] mx-auto mb-3" />
                    <p className="text-[rgba(248,249,250,0.4)] text-sm">No activities yet. Click a card to add one!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayLogs.map((log) => (
                      <div key={log.id} className="card p-3 flex items-center gap-3 hover:border-red-400/30 group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: `${log.color || '#52B788'}22` }}>
                          {getLogEmoji(log.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-offwhite truncate">{log.label}</p>
                          <p className="text-xs text-[rgba(248,249,250,0.4)] capitalize">{log.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#F4A261]">+{log.co2.toFixed(1)}</p>
                          <p className="text-xs text-[rgba(248,249,250,0.3)]">kg CO₂</p>
                        </div>
                        <button
                          onClick={() => removeLog(log.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 p-1"
                          aria-label={`Remove ${log.label} activity`}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <div className="p-3 rounded-xl bg-[rgba(82,183,136,0.08)] border border-[rgba(82,183,136,0.2)]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[rgba(248,249,250,0.6)]">Day Total</span>
                        <span className="font-display font-bold text-xl text-[#52B788]">{todayTotal.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: INSIGHTS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="insights">
            <SectionDivider title="Insights & Actions" subtitle="AI-powered tips personalized to your emission profile" icon={LucideIcons.Lightbulb} />

            {/* Top categories */}
            <div className="card p-5 mb-6">
              <p className="font-semibold text-offwhite mb-4 text-sm flex items-center gap-2">
                <Target size={16} className="text-[#52B788]" /> Your Top Emission Sources
              </p>
              <div className="grid grid-cols-3 gap-3">
                {topCategories.map((cat, i) => (
                  <div key={cat.name} className="text-center p-3 rounded-xl" style={{ background: `${CATEGORY_COLORS[cat.name] || '#52B788'}15`, border: `1px solid ${CATEGORY_COLORS[cat.name] || '#52B788'}30` }}>
                    <p className="text-xl mb-1">{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</p>
                    <p className="text-sm font-semibold capitalize" style={{ color: CATEGORY_COLORS[cat.name] || '#52B788' }}>{cat.name}</p>
                    <p className="text-xs text-[rgba(248,249,250,0.5)]">{cat.value} kg/mo</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tips */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-offwhite text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-[#52B788]" /> AI-Powered Tips
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[rgba(82,183,136,0.15)] text-[#52B788] border border-[rgba(82,183,136,0.3)]">
                    {aiProvider === 'gemini' ? 'Gemini 1.5' : 'Claude 3.5'}
                  </span>
                </p>
                {tipsGenerated && (
                  <button onClick={handleGenerateTips} disabled={tipsLoading} className="flex items-center gap-1.5 text-xs text-[#52B788] border border-[rgba(82,183,136,0.3)] hover:border-[#52B788] px-3 py-1.5 rounded-lg transition-all">
                    <RefreshCw size={12} className={tipsLoading ? 'animate-spin' : ''} /> Regenerate
                  </button>
                )}
              </div>

              {tipsError && (
                <div className="mb-4 p-4 rounded-xl bg-[rgba(244,162,97,0.1)] border border-[rgba(244,162,97,0.3)] flex items-start gap-3">
                  <Key size={15} className="text-[#F4A261] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#F4A261]">
                    {tipsError === 'no_key' ? <><strong>No API key.</strong> Add one in Settings for personalized tips. Showing sample tips below.</> : <><strong>API error.</strong> Showing sample tips instead.</>}
                  </p>
                </div>
              )}

              {!tipsGenerated && !tipsLoading && (
                <div className="card p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(82,183,136,0.1)] border border-[rgba(82,183,136,0.2)] flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={26} className="text-[#52B788]" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-offwhite mb-2">Get Personalized Tips</h3>
                  <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6 max-w-sm mx-auto">Our AI will analyze your emission profile and generate tailored recommendations.</p>
                  <button onClick={handleGenerateTips} className="btn-primary flex items-center gap-2 mx-auto">
                    <Sparkles size={15} /> Generate My Tips
                  </button>
                </div>
              )}

              {tipsLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="skeleton w-10 h-10 rounded-xl" />
                        <div className="flex-1"><div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/4" /></div>
                      </div>
                      <div className="skeleton h-3 w-full mb-2" /><div className="skeleton h-3 w-5/6 mb-4" />
                      <div className="flex justify-between"><div className="skeleton h-8 w-24" /><div className="skeleton h-8 w-28 rounded-xl" /></div>
                    </div>
                  ))}
                </div>
              )}

              {tipsGenerated && !tipsLoading && (
                <div className="space-y-4">
                  {tips.map((tip) => (
                    <TipCard key={tip.id} tip={tip} isCommitted={isCommitted(tip.id)} onCommit={commitAction} onUncommit={uncommitAction} />
                  ))}
                </div>
              )}
            </div>

            {/* Challenges */}
            <div>
              <p className="font-semibold text-offwhite mb-4 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#52B788]" /> Weekly Eco-Challenges
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {CHALLENGES.map((ch) => {
                  const done = completedChallenges.includes(ch.id);
                  const IconComp = LucideIcons[ch.icon] || LucideIcons.Leaf;
                  const cc = CATEGORY_COLORS[ch.category] || '#52B788';
                  return (
                    <div key={ch.id} className={`card p-5 ${done ? 'opacity-80' : ''}`} style={{ borderColor: done ? '#52B788' : undefined }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cc}22`, border: `1px solid ${cc}44` }}>
                            <IconComp size={18} style={{ color: cc }} />
                          </div>
                          <div>
                            <p className="font-semibold text-offwhite text-sm">{ch.title}</p>
                            <span className="text-xs text-[rgba(248,249,250,0.4)]">{ch.duration}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${ch.difficulty === 'Easy' ? 'diff-easy' : ch.difficulty === 'Medium' ? 'diff-medium' : 'diff-hard'}`}>{ch.difficulty}</span>
                      </div>
                      <p className="text-sm text-[rgba(248,249,250,0.55)] mb-4">{ch.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm"><span className="font-bold text-[#52B788]">-{ch.saving} kg</span><span className="text-[rgba(248,249,250,0.4)] text-xs ml-1">CO₂</span></p>
                        <button onClick={() => !done && completeChallenge(ch.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${done ? 'bg-[rgba(82,183,136,0.2)] text-[#52B788] border border-[rgba(82,183,136,0.4)] cursor-default' : 'btn-secondary text-xs'}`}>
                          {done ? <><CheckCircle2 size={14} /> Done!</> : 'Accept Challenge'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: PROGRESS
          ══════════════════════════════════════════════════════════════════ */}
          <Section id="progress">
            <SectionDivider title="Progress & History" subtitle="Your journey toward a lighter footprint" icon={LucideIcons.TrendingUp} />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Days Tracked', value: uniqueDays, icon: '📅', color: '#4CC9F0' },
                { label: 'Total Logged', value: `${totalLogged.toFixed(0)} kg`, icon: '📊', color: '#F4A261' },
                { label: 'Actions Committed', value: committedActions.length, icon: '💪', color: '#52B788' },
                { label: 'Badges Earned', value: badges.length, icon: '🏅', color: '#9B5DE5' },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-[rgba(248,249,250,0.45)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="card p-6 mb-5">
              <div className="flex items-center justify-between mb-5">
                <p className="font-semibold text-offwhite text-sm">Daily Footprint Heatmap</p>
                <div className="flex items-center gap-2">
                  <button onClick={prevCal} aria-label="Previous month" className="w-7 h-7 rounded-lg flex items-center justify-center text-[#52B788] border border-[rgba(82,183,136,0.3)] hover:border-[#52B788] hover:bg-[rgba(82,183,136,0.1)] transition-all"><ChevronLeft size={14} aria-hidden="true" /></button>
                  <button onClick={nextCal} aria-label="Next month" className="w-7 h-7 rounded-lg flex items-center justify-center text-[#52B788] border border-[rgba(82,183,136,0.3)] hover:border-[#52B788] hover:bg-[rgba(82,183,136,0.1)] transition-all disabled:opacity-30" disabled={calYear === new Date().getFullYear() && calMonth === new Date().getMonth()}><ChevronRight size={14} aria-hidden="true" /></button>
                </div>
              </div>
              <HeatmapCalendar logs={dailyLogs} year={calYear} month={calMonth} />
            </div>

            {/* Savings chart */}
            <div className="card p-6 mb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-offwhite text-sm flex items-center gap-2">
                  <TrendingDown size={16} className="text-[#52B788]" /> Cumulative CO₂ Savings
                </p>
                <div className="text-right">
                  <p className="font-display font-bold text-lg text-[#52B788]">{totalSavings} kg</p>
                  <p className="text-xs text-[rgba(248,249,250,0.4)]">potential/month</p>
                </div>
              </div>
              {savingsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={savingsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52B788" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.1)" />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<SavingsTooltip />} />
                    <Area type="monotone" dataKey="cumulative" stroke="#52B788" strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-36 flex flex-col items-center justify-center text-center">
                  <TrendingDown size={28} className="text-[rgba(82,183,136,0.2)] mb-2" />
                  <p className="text-[rgba(248,249,250,0.35)] text-sm">Commit to actions in Insights to track savings here.</p>
                </div>
              )}
              {committedActions.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-[rgba(82,183,136,0.1)] pt-4">
                  {committedActions.map((a) => (
                    <div key={a.tipId} className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(82,183,136,0.07)] border border-[rgba(82,183,136,0.15)]">
                      <p className="text-sm text-offwhite">{a.title}</p>
                      <span className="text-[#52B788] text-sm font-bold">-{a.saving} kg/mo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="card p-6 mb-10">
              <p className="font-semibold text-offwhite mb-5 text-sm flex items-center gap-2">
                <Award size={16} className="text-[#52B788]" /> Achievements
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[rgba(82,183,136,0.2)] text-[#52B788] border border-[rgba(82,183,136,0.3)]">{badges.length}/{BADGES.length}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {BADGES.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={badges.includes(badge.id)} />
                ))}
              </div>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
