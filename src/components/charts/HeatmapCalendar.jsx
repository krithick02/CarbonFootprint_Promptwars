import { useState } from 'react';
import { getDailyTotal, getCO2Color } from '../../utils/emissions';

/**
 * Monthly calendar heatmap showing daily carbon footprint.
 * Green = low, Amber = moderate, Red = high, Gray = no data.
 */
export default function HeatmapCalendar({ logs, year, month }) {
  const [tooltip, setTooltip] = useState(null);

  const today = new Date();
  const displayYear = year ?? today.getFullYear();
  const displayMonth = month ?? today.getMonth();

  const monthName = new Date(displayYear, displayMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Days in month
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(displayYear, displayMonth, 1).getDay();

  // Build cells
  const cells = [];
  // Empty cells for offset
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const total = getDailyTotal(logs, dateStr);
    const isFuture = new Date(displayYear, displayMonth, d) > today;
    cells.push({ day: d, dateStr, total, isFuture });
  }

  const getBgStyle = (cell) => {
    if (!cell.day || cell.isFuture) return { background: 'rgba(82, 183, 136, 0.06)' };
    if (cell.total === 0) return { background: 'rgba(82, 183, 136, 0.08)' };
    const color = getCO2Color(cell.total, 15);
    const alpha = Math.min(0.3 + (cell.total / 30) * 0.7, 1);
    return { background: color + Math.round(alpha * 255).toString(16).padStart(2, '0') };
  };

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <h3 className="font-semibold text-offwhite mb-4">{monthName}</h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-[rgba(248,249,250,0.35)] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="heatmap-cell relative flex items-center justify-center cursor-pointer"
            style={getBgStyle(cell)}
            onMouseEnter={(e) => {
              if (cell.day && !cell.isFuture) {
                setTooltip({ day: cell.day, total: cell.total, x: e.clientX, y: e.clientY });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {cell.day && (
              <span className="text-xs text-[rgba(248,249,250,0.6)]">{cell.day}</span>
            )}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 glass rounded-lg px-3 py-2 text-xs pointer-events-none"
          style={{ top: tooltip.y - 50, left: tooltip.x + 10 }}
        >
          <p className="text-offwhite font-semibold">Day {tooltip.day}</p>
          <p className="text-mint">{tooltip.total > 0 ? `${tooltip.total.toFixed(1)} kg CO₂` : 'No data'}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-[rgba(248,249,250,0.5)]">
        <span>Less</span>
        {['#52B788', '#8BC4A0', '#F4A261', '#E97545', '#E63946'].map((c) => (
          <div key={c} className="w-4 h-4 rounded-sm" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
