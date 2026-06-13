import { useState } from 'react';
import { Trash2, PlusCircle, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import ActivityCard from '../components/cards/ActivityCard';
import { QUICK_ACTIVITIES } from '../data/constants';

export default function DailyLog() {
  const { addLog, dailyLogs, removeLog } = useApp();
  const [filter, setFilter] = useState('all');

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

  const categories = ['all', 'transport', 'food', 'energy', 'shopping'];
  const filtered = filter === 'all'
    ? QUICK_ACTIVITIES
    : QUICK_ACTIVITIES.filter((a) => a.category === filter);

  const getImpactLevel = (co2) => {
    if (co2 <= 11) return { label: 'Low Impact Day', color: '#52B788' };
    if (co2 <= 22) return { label: 'Moderate Day', color: '#F4A261' };
    return { label: 'High Impact Day', color: '#E63946' };
  };

  const impact = getImpactLevel(todayTotal);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-offwhite mb-1">Daily Log</h1>
        <p className="text-[rgba(248,249,250,0.5)] text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Total Card */}
      <div className="card p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-[rgba(248,249,250,0.45)] mb-1 flex items-center gap-1.5">
            <Calendar size={12} />
            Today's Total
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-display font-bold text-5xl"
              style={{ color: impact.color }}
            >
              {todayTotal.toFixed(1)}
            </span>
            <span className="text-lg text-[rgba(248,249,250,0.5)]">kg CO₂</span>
          </div>
          <span
            className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${impact.color}22`, color: impact.color, border: `1px solid ${impact.color}44` }}
          >
            {impact.label}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-[rgba(248,249,250,0.35)] mb-1">{todayLogs.length} activities logged</p>
          <div className="text-right">
            <p className="text-xs text-[rgba(248,249,250,0.35)]">Daily target</p>
            <p className="text-sm font-semibold text-mint">≤ 11 kg</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Add Activities */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-offwhite">Quick Add</h2>
            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 capitalize ${
                    filter === cat
                      ? 'bg-mint text-white'
                      : 'text-[rgba(248,249,250,0.5)] border border-[rgba(82,183,136,0.2)] hover:border-mint hover:text-mint'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} onConfirm={handleConfirm} />
            ))}
          </div>
        </div>

        {/* Today's Log */}
        <div>
          <h2 className="font-semibold text-offwhite mb-4">Today's Entries</h2>
          {todayLogs.length === 0 ? (
            <div className="card p-6 text-center">
              <PlusCircle size={32} className="text-[rgba(82,183,136,0.3)] mx-auto mb-3" />
              <p className="text-[rgba(248,249,250,0.4)] text-sm">
                No activities logged yet. Click a card to add one!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="card p-3 flex items-center gap-3 hover:border-red-400/30 group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: `${log.color || '#52B788'}22` }}
                  >
                    {log.icon === 'Car' ? '🚗' :
                     log.icon === 'Beef' ? '🥩' :
                     log.icon === 'Plane' ? '✈️' :
                     log.icon === 'ShoppingBag' ? '🛍️' :
                     log.icon === 'Wind' ? '❄️' :
                     log.icon === 'Leaf' ? '🥦' :
                     log.icon === 'UtensilsCrossed' ? '🍗' :
                     log.icon === 'Bus' ? '🚌' : '📝'}
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
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Running total */}
              <div className="mt-3 p-3 rounded-xl bg-[rgba(82,183,136,0.08)] border border-[rgba(82,183,136,0.2)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[rgba(248,249,250,0.6)]">Day Total</span>
                  <span className="font-display font-bold text-xl text-mint">{todayTotal.toFixed(2)} kg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
