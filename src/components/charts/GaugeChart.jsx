import { useEffect, useRef, useState } from 'react';

/**
 * Animated SVG gauge chart for displaying carbon footprint score.
 * color transitions: green (low) → amber (medium) → red (high)
 */
export default function GaugeChart({ value, max = 500, size = 220, label = 'kg CO₂e / month' }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    let start = null;
    const target = Math.min(value, max);
    const duration = 1200;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedValue(target * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, max]);

  const ratio = Math.min(animatedValue / max, 1);
  const strokeWidth = 18;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc goes from 135° to 405° (270° sweep)
  const startAngle = 135;
  const sweepAngle = 270;
  const endAngle = startAngle + sweepAngle * ratio;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (start, end) => {
    const x1 = cx + radius * Math.cos(toRad(start));
    const y1 = cy + radius * Math.sin(toRad(start));
    const x2 = cx + radius * Math.cos(toRad(end));
    const y2 = cy + radius * Math.sin(toRad(end));
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Color based on ratio
  const getColor = () => {
    if (ratio < 0.4) return '#52B788';
    if (ratio < 0.7) return '#F4A261';
    return '#E63946';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={arcPath(startAngle, startAngle + sweepAngle)}
            fill="none"
            stroke="rgba(82, 183, 136, 0.12)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {ratio > 0 && (
            <path
              d={arcPath(startAngle, endAngle)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#glow-filter)"
              style={{ transition: 'stroke 0.5s ease' }}
            />
          )}

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const angle = toRad(startAngle + sweepAngle * t);
            const innerR = radius - strokeWidth;
            const outerR = radius + 6;
            return (
              <line
                key={t}
                x1={cx + innerR * Math.cos(angle)}
                y1={cy + innerR * Math.sin(angle)}
                x2={cx + outerR * Math.cos(angle)}
                y2={cy + outerR * Math.sin(angle)}
                stroke="rgba(82, 183, 136, 0.3)"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold text-4xl leading-none"
            style={{ color }}
          >
            {Math.round(animatedValue)}
          </span>
          <span className="text-xs text-[rgba(248,249,250,0.5)] mt-1 text-center px-4">{label}</span>
          <div
            className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${color}22`,
              color,
              border: `1px solid ${color}44`,
            }}
          >
            {ratio < 0.4 ? 'Low Impact' : ratio < 0.7 ? 'Moderate' : 'High Impact'}
          </div>
        </div>
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-full mt-1 px-4" style={{ maxWidth: size }}>
        <span className="text-xs text-[rgba(248,249,250,0.4)]">0</span>
        <span className="text-xs text-[rgba(248,249,250,0.4)]">{max} kg</span>
      </div>
    </div>
  );
}
