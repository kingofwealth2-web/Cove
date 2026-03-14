import { useState } from "react";
import { springs } from "../../tokens/springs";

export default function YearBar({ selectedYear, onYearChange, minYear, maxYear, C, isMobile }) {
  const [animDir, setAnimDir] = useState(null); // "left" | "right"
  const [visible, setVisible] = useState(true);
  const isCurrentYear = selectedYear === maxYear;

  const go = (dir) => {
    const next = selectedYear + dir;
    if (next < minYear || next > maxYear) return;
    setAnimDir(dir > 0 ? "right" : "left");
    setVisible(false);
    setTimeout(() => {
      onYearChange(next);
      setAnimDir(null);
      setVisible(true);
    }, 120);
  };

  const btnStyle = (disabled) => ({
    width: 28, height: 28, borderRadius: 8,
    border: `1px solid ${disabled ? C.border + "44" : C.border}`,
    background: disabled ? "transparent" : C.surfaceAlt,
    color: disabled ? C.textMuted + "44" : C.textSub,
    cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700,
    transition: `all 150ms ${springs.snap}`,
  });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: isCurrentYear ? "transparent" : C.warning + "18",
      border: `1px solid ${isCurrentYear ? C.border : C.warning + "44"}`,
      borderRadius: 12, padding: "5px 10px",
      transition: `all 300ms ${springs.smooth}`,
    }}>
      <button
        aria-label="Previous year"
        style={btnStyle(selectedYear <= minYear)}
        onClick={() => go(-1)}
        onMouseEnter={e => { if (selectedYear > minYear) e.currentTarget.style.background = C.surfaceHover; }}
        onMouseLeave={e => { e.currentTarget.style.background = selectedYear > minYear ? C.surfaceAlt : "transparent"; }}
      >‹</button>

      <div style={{
        minWidth: 48, textAlign: "center",
        fontFamily: "'DM Serif Display', serif",
        fontSize: isMobile ? 15 : 14,
        fontWeight: 700,
        color: isCurrentYear ? C.text : C.warning,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${animDir === "right" ? "-6px" : "6px"})`,
        transition: `opacity 120ms, transform 120ms ${springs.snap}`,
      }}>{selectedYear}</div>

      <button
        aria-label="Next year"
        style={btnStyle(selectedYear >= maxYear)}
        onClick={() => go(1)}
        onMouseEnter={e => { if (selectedYear < maxYear) e.currentTarget.style.background = C.surfaceHover; }}
        onMouseLeave={e => { e.currentTarget.style.background = selectedYear < maxYear ? C.surfaceAlt : "transparent"; }}
      >›</button>

      {!isCurrentYear && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.warning,
          background: C.warning + "22", borderRadius: 6,
          padding: "2px 6px", letterSpacing: "0.05em", textTransform: "uppercase",
          marginLeft: 2,
        }}>Read Only</div>
      )}
    </div>
  );
}
