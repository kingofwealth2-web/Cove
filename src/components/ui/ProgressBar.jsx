import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function ProgressBar({ value, max, color, delay = 0, height = 5, C }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct > 80 ? C.expense : pct > 60 ? C.warning : color;
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height, borderRadius: 99, background: C.surfaceAlt, overflow: "hidden", flexShrink: 0 }}
    >
      <div style={{
        height: "100%", borderRadius: 99, background: barColor, width: `${w}%`,
        transition: `width 700ms ${springs.smooth}`,
        boxShadow: pct > 80 ? `0 0 6px ${barColor}` : "none",
      }} />
    </div>
  );
}
