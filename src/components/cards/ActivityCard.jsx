import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function ActivityCard({ activity, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);
  const [co2Preview] = useState(activity.defaultCo2);

  const IconComponent = LucideIcons[activity.icon] || LucideIcons.Zap;

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    onConfirm(activity);
    // Reset after short delay to allow re-logging
    setTimeout(() => setConfirmed(false), 2000);
  };

  return (
    <div
      className="card p-4 cursor-pointer group"
      style={{ borderColor: confirmed ? '#52B788' : undefined }}
      onClick={handleConfirm}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
        style={{ background: `${activity.color}22`, border: `1px solid ${activity.color}44` }}
      >
        <IconComponent size={20} style={{ color: activity.color }} />
      </div>

      {/* Label */}
      <p className="font-semibold text-offwhite text-sm mb-1">{activity.label}</p>
      <p className="text-xs text-[rgba(248,249,250,0.45)] mb-3">{activity.description}</p>

      {/* CO₂ impact */}
      <div className="flex items-center justify-between">
        <div>
          <span
            className="text-lg font-display font-bold"
            style={{ color: activity.color }}
          >
            +{co2Preview.toFixed(1)}
          </span>
          <span className="text-xs text-[rgba(248,249,250,0.5)] ml-1">kg CO₂</span>
        </div>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: confirmed ? '#52B788' : `${activity.color}22`,
            border: `1px solid ${confirmed ? '#52B788' : activity.color + '66'}`,
          }}
        >
          {confirmed ? (
            <Check size={14} className="text-white" />
          ) : (
            <Plus size={14} style={{ color: activity.color }} />
          )}
        </div>
      </div>

      {confirmed && (
        <div className="mt-2 text-xs text-mint font-medium animate-fade-in-up">
          ✓ Logged!
        </div>
      )}
    </div>
  );
}
