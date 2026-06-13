import { Lock } from 'lucide-react';

export default function BadgeCard({ badge, earned }) {
  return (
    <div
      className={`card p-4 text-center transition-all duration-300 ${earned ? 'badge-earned' : 'badge-locked'}`}
    >
      <div className="text-4xl mb-2 leading-none">
        {earned ? badge.icon : <Lock size={28} className="mx-auto text-[rgba(248,249,250,0.2)]" />}
      </div>
      <p className={`font-semibold text-sm mb-1 ${earned ? 'text-offwhite' : 'text-[rgba(248,249,250,0.3)]'}`}>
        {badge.title}
      </p>
      <p className={`text-xs ${earned ? 'text-[rgba(248,249,250,0.55)]' : 'text-[rgba(248,249,250,0.25)]'}`}>
        {badge.description}
      </p>
      {earned && (
        <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-mint/20 text-mint border border-mint/30">
          Earned ✓
        </div>
      )}
    </div>
  );
}
