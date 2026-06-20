/**
 * Shared Recharts tooltip components used across Dashboard and MainApp.
 * Centralised here to avoid duplication.
 */

/**
 * Tooltip for PieChart / donut charts — shows category name and CO₂ value.
 */
export function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-offwhite font-semibold">{payload[0].name}</p>
        <p className="text-mint">{payload[0].value} kg CO₂</p>
      </div>
    );
  }
  return null;
}

/**
 * Tooltip for LineChart — shows week label and CO₂ total.
 */
export function LineTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-[rgba(248,249,250,0.6)] text-xs">{label}</p>
        <p className="text-mint font-semibold">{payload[0].value} kg CO₂</p>
      </div>
    );
  }
  return null;
}

/**
 * Tooltip for AreaChart savings — shows action label and kg saved.
 */
export function SavingsTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-[rgba(248,249,250,0.6)] text-xs">{label}</p>
        <p className="text-mint font-semibold">{payload[0].value} kg saved</p>
      </div>
    );
  }
  return null;
}
