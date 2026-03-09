import { springs } from "../../tokens/springs";

export default function MobileTopBar({ onMenuOpen, onAdd, C, notifications, title }) {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px",
    }}>
      <button onClick={onMenuOpen} style={{
        background: C.surfaceAlt, border: "none", cursor: "pointer",
        borderRadius: 10, width: 36, height: 36,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
      }}>
        <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
        <div style={{ width: 14, height: 2, borderRadius: 2, background: C.textSub }} />
        <div style={{ width: 18, height: 2, borderRadius: 2, background: C.text }} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28,
          background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.text, letterSpacing: "-0.5px" }}>Cove</span>
      </div>

      <button onClick={onAdd} style={{
        background: C.accent, border: "none", cursor: "pointer",
        borderRadius: 10, width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 22, fontWeight: 300,
        boxShadow: `0 4px 12px ${C.accentGlow}`,
      }}>+</button>
    </div>
  );
}
