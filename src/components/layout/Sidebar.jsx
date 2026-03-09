import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

const NAV = [
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "budget", label: "Budget", emoji: "📊" },
  { id: "trends", label: "Trends", emoji: "📈" },
  { id: "bills", label: "Bills", emoji: "📋" },
  { id: "goals", label: "Goals", emoji: "🎯" },
  { id: "debt", label: "Debt", emoji: "💳" },
  { id: "networth", label: "Net Worth", emoji: "🏦" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
];

export default function Sidebar({ active, setActive, onAdd, user, C, notifications, mobileOpen, onMobileClose }) {
  const unread = notifications.filter(n => !n.read).length;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleNav = (id) => {
    setActive(id);
    if (isMobile) onMobileClose();
  };

  const sidebarContent = (
    <aside style={{
      width: 224, minWidth: 224, height: "100vh",
      background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", padding: "24px 0",
      position: isMobile ? "fixed" : "sticky",
      top: 0, left: 0, zIndex: isMobile ? 300 : "auto",
      transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
      transition: `transform 350ms ${springs.bounce}`,
      boxShadow: isMobile && mobileOpen ? "8px 0 40px rgba(0,0,0,0.5)" : "none",
    }}>
      <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px ${C.accentGlow}`, flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
              <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, letterSpacing: "-0.5px" }}>Cove</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => handleNav("notifications")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            {unread > 0 && (
              <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: C.expense, border: `2px solid ${C.surface}` }} />
            )}
          </button>
          {isMobile && (
            <button onClick={onMobileClose} style={{ background: C.surfaceAlt, border: "none", cursor: "pointer", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, fontSize: 16 }}>×</button>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item, i) => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 12, border: "none", cursor: "pointer",
              background: isActive ? C.accentSoft : "transparent",
              color: isActive ? C.accent : C.textSub,
              fontSize: 14, fontWeight: isActive ? 600 : 400, textAlign: "left",
              transition: `all 200ms ${springs.snap}`,
              animation: `slideIn 300ms ${springs.bounce} both`,
              animationDelay: `${i * 35}ms`,
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.color = C.text; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}}
            >
              <span style={{ fontSize: 16 }}>{item.emoji}</span>
              {item.label}
              {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px 10px" }}>
        <button onClick={() => { onAdd(); if (isMobile) onMobileClose(); }} style={{
          width: "100%", padding: "12px", background: C.accent, color: "white",
          border: "none", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 8px 24px ${C.accentGlow}`, transition: `all 200ms ${springs.snap}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
        >+ Add Transaction</button>
      </div>

      <div style={{ margin: "8px 10px 0", padding: "12px", borderRadius: 14, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{user.currency} · Personal</div>
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div onClick={onMobileClose} style={{
            position: "fixed", inset: 0, zIndex: 299,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            animation: `fadeIn 200ms ${springs.snap}`,
          }} />
        )}
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
}
