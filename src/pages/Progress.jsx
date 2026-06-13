import { useState } from 'react';
import { ChevronLeft, ChevronRight, Award, TrendingDown } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import HeatmapCalendar from '../components/charts/HeatmapCalendar';
import BadgeCard from '../components/cards/BadgeCard';
import { BADGES } from '../data/constants';

const SavingsTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-[rgba(248,249,250,0.6)] text-xs">{label}</p>
        <p className="text-mint font-semibold">{payload[0].value} kg saved</p>
      </div>
    );
  }
  return null;
};

export default function Progress() {
  const { dailyLogs, badges, committedActions, totalSavings } = useApp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build cumulative savings data from committed actions
  const savingsData = (() => {
    if (committedActions.length === 0) return [];
    const sorted = [...committedActions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    return sorted.map((action, i) => {
      cumulative += action.saving || 0;
      return {
        name: `Action ${i + 1}`,
        label: action.title?.slice(0, 20) || `Action ${i + 1}`,
        cumulative: Math.round(cumulative),
      };
    });
  })();

  // Stats
  const totalLogged = dailyLogs.reduce((s, l) => s + l.co2, 0);
  const uniqueDays = new Set(dailyLogs.map(l => l.date)).size;
  const earnedBadges = badges.length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-offwhite mb-1">Progress & History</h1>
        <p className="text-[rgba(248,249,250,0.5)] text-sm">Your journey toward a lighter footprint</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Days Tracked', value: uniqueDays, icon: '📅', color: '#4CC9F0' },
          { label: 'Total Logged', value: `${totalLogged.toFixed(0)} kg`, icon: '📊', color: '#F4A261' },
          { label: 'Actions Committed', value: committedActions.length, icon: '💪', color: '#52B788' },
          { label: 'Badges Earned', value: earnedBadges, icon: '🏅', color: '#9B5DE5' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="font-display font-bold text-2xl" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[rgba(248,249,250,0.45)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar Heatmap */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-offwhite">Daily Footprint Heatmap</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-mint border border-[rgba(82,183,136,0.3)] hover:border-mint hover:bg-[rgba(82,183,136,0.1)] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-mint border border-[rgba(82,183,136,0.3)] hover:border-mint hover:bg-[rgba(82,183,136,0.1)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <HeatmapCalendar logs={dailyLogs} year={viewYear} month={viewMonth} />
      </div>

      {/* Cumulative Savings */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-offwhite flex items-center gap-2">
            <TrendingDown size={18} className="text-mint" />
            Cumulative CO₂ Savings
          </h2>
          <div className="text-right">
            <p className="font-display font-bold text-xl text-mint">{totalSavings} kg</p>
            <p className="text-xs text-[rgba(248,249,250,0.4)]">potential / month</p>
          </div>
        </div>

        {savingsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={savingsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52B788" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.1)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(248,249,250,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<SavingsTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#52B788"
                strokeWidth={2.5}
                fill="url(#savingsGradient)"
                dot={{ fill: '#52B788', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#74C69D' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <TrendingDown size={32} className="text-[rgba(82,183,136,0.2)] mb-3" />
            <p className="text-[rgba(248,249,250,0.35)] text-sm">
              Commit to reduction actions on the Insights page to track your savings here.
            </p>
          </div>
        )}

        {/* Committed Actions List */}
        {committedActions.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-[rgba(82,183,136,0.1)] pt-4">
            <p className="text-xs text-[rgba(248,249,250,0.4)] mb-3">Committed Actions</p>
            {committedActions.map((action) => (
              <div key={action.tipId} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(82,183,136,0.07)] border border-[rgba(82,183,136,0.15)]">
                <p className="text-sm text-offwhite">{action.title}</p>
                <span className="text-mint text-sm font-bold">-{action.saving} kg/mo</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="card p-6">
        <h2 className="font-semibold text-offwhite mb-5 flex items-center gap-2">
          <Award size={18} className="text-mint" />
          Achievements
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-mint/20 text-mint border border-mint/30">
            {earnedBadges}/{BADGES.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={badges.includes(badge.id)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
