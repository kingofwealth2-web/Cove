import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function GoalRing({ current, target, color, size = 80, C }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circ * (1 - pct);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Track color: theme-aware via C prop (falls back to a safe default)
  const trackColor = C ? C.surfaceAlt : "rgba(255,255,255,0.07)";

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
      role="img"
      aria-label={`${Math.round(pct * 100)}% of goal reached`}
    >
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={animated ? offset : circ}
        style={{ transition: `stroke-dashoffset 900ms ${springs.smooth}` }}
      />
    </svg>
  );
}
