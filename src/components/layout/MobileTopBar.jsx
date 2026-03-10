import { springs } from "../../tokens/springs";
import YearBar from "../ui/YearBar";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export default function MobileTopBar({ onMenuOpen, onAdd, C, notifications, theme, onThemeToggle, yearBarProps, isReadOnly }) {
  const unread = notifications.filter(n => !n.read).length;
  const isDark = theme === "dark";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: C.surface,
      borderBottom: `1px solid ${isReadOnly ? C.warning + "44" : C.border}`,
      display: "flex", flexDirection: "column",
      transition: `border-color 300ms ${springs.smooth}`,
    }}>
      {/* Main row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 6px", gap: 8,
      }}>
        {/* Left: hamburger */}
        <button onClick={onMenuOpen} style={{
          background: C.surfaceAlt, border: "none", cursor: "pointer",
          borderRadius: 10, width: 36, height: 36,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
          <div style={{ width: 14, height: 2, borderRadius: 2, background: C.textSub }} />
          <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
        </button>

        {/* Center: YearBar */}
        {yearBarProps && <YearBar {...yearBarProps} isMobile />}

        {/* Right: theme + add */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onThemeToggle} style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.surfaceAlt, border: `1px solid ${C.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: isDark ? "#FFD60A" : "#5254CC",
            transition: `all 200ms ${springs.snap}`,
          }}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button onClick={onAdd} disabled={isReadOnly} style={{
            background: isReadOnly ? C.surfaceAlt : C.accent,
            border: "none", cursor: isReadOnly ? "not-allowed" : "pointer",
            borderRadius: 10, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isReadOnly ? C.textMuted : "white", fontSize: 22, fontWeight: 300,
            boxShadow: isReadOnly ? "none" : `0 4px 12px ${C.accentGlow}`,
            transition: `all 200ms ${springs.snap}`,
            opacity: isReadOnly ? 0.4 : 1,
          }}>+</button>
        </div>
      </div>

      {/* Read-only strip */}
      {isReadOnly && (
        <div style={{
          padding: "4px 16px 8px",
          fontSize: 11, fontWeight: 600, color: C.warning,
          textAlign: "center", letterSpacing: "0.03em",
        }}>
          📅 {yearBarProps?.selectedYear} — Read Only
        </div>
      )}
    </div>
  );
}