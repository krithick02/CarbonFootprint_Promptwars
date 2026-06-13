// Dashboard Page
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Flame, TrendingUp, Globe, Leaf } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import GaugeChart from '../components/charts/GaugeChart';
import { CATEGORY_COLORS, CATEGORY_LABELS, GLOBAL_BENCHMARKS } from '../data/constants';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-offwhite font-semibold">{payload[0].name}</p>
        <p className="text-mint">{payload[0].value} kg CO₂</p>
      </div>
    );
  }
  return null;
};

const LineTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-[rgba(248,249,250,0.6)] text-xs">{label}</p>
        <p className="text-mint font-semibold">{payload[0].value} kg CO₂</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    monthlyFootprint, categoryBreakdown, weeklyTrend,
    streak, onboardingComplete, dailyLogs,
  } = useApp();

  if (!onboardingComplete) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="w-24 h-24 rounded-full bg-[rgba(82,183,136,0.1)] flex items-center justify-center mb-6">
            <Leaf size={40} className="text-mint" />
          </div>
          <h2 className="font-display font-bold text-3xl text-offwhite mb-3">Welcome to EcoTrack!</h2>
          <p className="text-[rgba(248,249,250,0.55)] mb-8 max-w-sm">
            Complete onboarding to set your carbon baseline and unlock your dashboard.
          </p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary text-base px-8 py-4">
            Set Up My Profile
          </button>
        </div>
      </Layout>
    );
  }

  const monthlyTarget = GLOBAL_BENCHMARKS.parisTarget / 12;
  const globalMonthly = GLOBAL_BENCHMARKS.globalAverage / 12;

  // Pie data with nice labels
  const pieData = categoryBreakdown
    .filter((c) => c.value > 0)
    .map((c) => ({
      ...c,
      name: CATEGORY_LABELS[c.name] || c.name,
      fill: CATEGORY_COLORS[c.name] || '#52B788',
    }));

  const todayTotal = dailyLogs
    .filter((l) => l.date === new Date().toISOString().split('T')[0])
    .reduce((s, l) => s + l.co2, 0);

  return (
    <Layout>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-offwhite">Dashboard</h1>
          <p className="text-[rgba(248,249,250,0.5)] text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/log')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusCircle size={16} />
          Log Activity
        </button>
      </div>

      {/* ── Top Row ──────────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Gauge */}
        <div className="card p-6 flex flex-col items-center md:col-span-1">
          <h2 className="font-semibold text-offwhite mb-4 w-full">Monthly Footprint</h2>
          <GaugeChart value={monthlyFootprint} max={500} />
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              icon: Globe,
              label: 'vs. Global Avg',
              value: globalMonthly > 0 ? `${((monthlyFootprint / globalMonthly) * 100).toFixed(0)}%` : '—',
              sub: `${globalMonthly.toFixed(0)} kg avg/mo`,
              color: '#F4A261',
            },
            {
              icon: TrendingUp,
              label: 'Paris Target',
              value: `${monthlyTarget.toFixed(0)} kg`,
              sub: monthlyFootprint <= monthlyTarget ? '✓ On target!' : `${(monthlyFootprint - monthlyTarget).toFixed(0)} kg over`,
              color: monthlyFootprint <= monthlyTarget ? '#52B788' : '#E63946',
            },
            {
              icon: Flame,
              label: 'Green Streak',
              value: `${streak} day${streak !== 1 ? 's' : ''}`,
              sub: streak > 0 ? '🔥 Keep it up!' : 'Log a green day to start',
              color: '#F4A261',
            },
            {
              icon: PlusCircle,
              label: "Today's Log",
              value: `${todayTotal.toFixed(1)} kg`,
              sub: todayTotal === 0 ? 'Nothing logged yet' : 'CO₂ logged today',
              color: '#4CC9F0',
            },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}22` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <span className="text-xs text-[rgba(248,249,250,0.5)]">{stat.label}</span>
              </div>
              <p className="font-display font-bold text-2xl text-offwhite">{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: stat.color }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-offwhite mb-4">Category Breakdown</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[rgba(248,249,250,0.7)]">{entry.name}</span>
                        <span className="font-semibold text-offwhite">{entry.value} kg</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${monthlyFootprint > 0 ? (entry.value / monthlyFootprint) * 100 : 0}%`,
                            background: entry.fill,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[rgba(248,249,250,0.3)] text-sm">
              Log activities to see your breakdown
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-offwhite mb-4">Weekly Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.1)" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LineTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#52B788"
                strokeWidth={2.5}
                dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#74C69D' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Comparison Bar ───────────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="font-semibold text-offwhite mb-5">Your Footprint vs. Global Benchmarks</h2>
        <div className="space-y-4">
          {[
            {
              label: 'You (this month)',
              value: monthlyFootprint,
              annual: monthlyFootprint * 12,
              color: monthlyFootprint > globalMonthly ? '#E63946' : '#52B788',
            },
            {
              label: 'Global Average',
              value: globalMonthly,
              annual: GLOBAL_BENCHMARKS.globalAverage,
              color: '#F4A261',
            },
            {
              label: 'Paris Agreement Target',
              value: monthlyTarget,
              annual: GLOBAL_BENCHMARKS.parisTarget,
              color: '#52B788',
            },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[rgba(248,249,250,0.7)]">{bar.label}</span>
                <div className="flex gap-3">
                  <span className="font-semibold" style={{ color: bar.color }}>
                    {bar.value.toFixed(0)} kg/mo
                  </span>
                  <span className="text-[rgba(248,249,250,0.4)] text-xs self-center">
                    {(bar.annual / 1000).toFixed(1)}t/yr
                  </span>
                </div>
              </div>
              <div className="progress-bar h-3">
                <div
                  className="progress-bar-fill h-full rounded-full"
                  style={{
                    width: `${Math.min((bar.value / 700) * 100, 100)}%`,
                    background: bar.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
