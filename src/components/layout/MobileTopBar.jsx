import { useRef, useEffect } from "react";
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
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function MobileTopBar({
  onMenuOpen, onAdd, C, notifications, theme, onThemeToggle,
  yearBarProps, isReadOnly, activeScreen,
  searchQuery, onSearchChange, searchActive, onSearchToggle,
}) {
  const isDark = theme === "dark";
  const isHome = activeScreen === "home";
  const searchRef = useRef(null);

  // Auto-focus search input when activated
  useEffect(() => {
    if (searchActive && isHome) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [searchActive, isHome]);

  // Escape key closes search
  useEffect(() => {
    if (!searchActive) return;
    const handler = (e) => { if (e.key === "Escape") onSearchToggle(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchActive, onSearchToggle]);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: C.surface,
      borderBottom: `1px solid ${isReadOnly ? C.warning + "44" : C.border}`,
      display: "flex", flexDirection: "column",
      transition: "border-color 300ms",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        padding: "10px 16px 6px", gap: 8,
      }}>
        {/* Hamburger */}
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            background: C.surfaceAlt, border: "none", cursor: "pointer",
            borderRadius: 10, width: 36, height: 36, flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
          <div style={{ width: 14, height: 2, borderRadius: 2, background: C.textSub }} />
          <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
        </button>

        {/* Search input (home + active) */}
        {isHome && searchActive ? (
          <>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: C.surfaceAlt, borderRadius: 12, padding: "8px 12px",
              border: "1px solid " + C.accent + "40",
            }}>
              <SearchIcon />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search transactions…"
                aria-label="Search transactions"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 14, color: C.text, fontFamily: "inherit",
                }}
              />
              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  onClick={() => onSearchChange("")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.textMuted, fontSize: 16, padding: 0, lineHeight: 1,
                  }}
                >✕</button>
              ) : null}
            </div>
            <button onClick={onSearchToggle} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.accent, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            }}>Done</button>
          </>
        ) : (
          <>
            {/* Year bar center */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              {yearBarProps && <YearBar {...yearBarProps} isMobile />}
            </div>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {isHome && (
                <button
                  aria-label="Search transactions"
                  onClick={onSearchToggle}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: C.surfaceAlt, border: "1px solid " + C.border,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.textSub,
                  }}
                >
                  <SearchIcon />
                </button>
              )}
              <button
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                onClick={onThemeToggle}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: C.surfaceAlt, border: "1px solid " + C.border,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: isDark ? "#FFD60A" : "#5254CC",
                }}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                aria-label={isReadOnly ? "Read-only mode" : "Add transaction"}
                onClick={onAdd}
                disabled={isReadOnly}
                style={{
                  background: isReadOnly ? C.surfaceAlt : C.accent,
                  border: "none", cursor: isReadOnly ? "not-allowed" : "pointer",
                  borderRadius: 10, width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isReadOnly ? C.textMuted : "white", fontSize: 22, fontWeight: 300,
                  boxShadow: isReadOnly ? "none" : "0 4px 12px " + C.accentGlow,
                  opacity: isReadOnly ? 0.4 : 1,
                }}
              >+</button>
            </div>
          </>
        )}
      </div>

      {/* Read-only strip */}
      {isReadOnly && (
        <div style={{
          padding: "4px 16px 8px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 11, fontWeight: 600, color: C.warning,
        }}>
          📅 {yearBarProps?.selectedYear} — Read Only
          <button onClick={() => yearBarProps?.onYearChange(new Date().getFullYear())} style={{
            background: C.warning, color: "white", border: "none",
            borderRadius: 6, padding: "2px 8px", fontSize: 11,
            fontWeight: 700, cursor: "pointer",
          }}>↩ Now</button>
        </div>
      )}
    </div>
  );
}
