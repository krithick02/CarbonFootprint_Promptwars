import { Check, Leaf, Zap, Car, ShoppingBag } from 'lucide-react';
import { CATEGORY_COLORS } from '../../data/constants';

const CATEGORY_ICONS = {
  food: Leaf,
  transport: Car,
  energy: Zap,
  shopping: ShoppingBag,
};

const DIFFICULTY_STYLES = {
  Easy: 'diff-easy',
  Medium: 'diff-medium',
  Hard: 'diff-hard',
};

export default function TipCard({ tip, isCommitted, onCommit, onUncommit }) {
  const CategoryIcon = CATEGORY_ICONS[tip.category] || Leaf;
  const catColor = CATEGORY_COLORS[tip.category] || '#52B788';

  return (
    <div
      className="card p-5 transition-all duration-300"
      style={{ borderColor: isCommitted ? '#52B788' : undefined }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${catColor}22`, border: `1px solid ${catColor}44` }}
          >
            <CategoryIcon size={18} style={{ color: catColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-offwhite text-sm leading-snug">{tip.title}</h3>
            <span
              className="text-xs font-medium capitalize"
              style={{ color: catColor }}
            >
              {tip.category}
            </span>
          </div>
        </div>

        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${DIFFICULTY_STYLES[tip.difficulty] || 'diff-easy'}`}>
          {tip.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-[rgba(248,249,250,0.65)] mb-3 leading-relaxed">
        {tip.description}
      </p>

      {/* Action */}
      {tip.action && (
        <div className="bg-[rgba(82,183,136,0.08)] border border-[rgba(82,183,136,0.2)] rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-mint font-medium">💡 {tip.action}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[rgba(248,249,250,0.45)]">Monthly saving</p>
          <p className="font-display font-bold text-lg text-mint">
            -{tip.monthlySaving} <span className="text-xs font-normal text-[rgba(248,249,250,0.5)]">kg CO₂</span>
          </p>
        </div>

        {isCommitted ? (
          <button
            onClick={() => onUncommit && onUncommit(tip.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-mint/20 text-mint border border-mint/40 hover:bg-red-400/20 hover:text-red-400 hover:border-red-400/40 transition-all duration-300"
          >
            <Check size={14} />
            Committed
          </button>
        ) : (
          <button
            onClick={() => onCommit && onCommit(tip)}
            className="btn-primary text-sm py-2 px-4"
          >
            Commit to this
          </button>
        )}
      </div>
    </div>
  );
}
