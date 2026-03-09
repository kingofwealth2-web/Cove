import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

const NAV = [
  { id: "home",     label: "Home",      emoji: "🏠" },
  { id: "budget",   label: "Budget",    emoji: "📊" },
  { id: "trends",   label: "Trends",    emoji: "📈" },
  { id: "bills",    label: "Bills",     emoji: "📋" },
  { id: "goals",    label: "Goals",     emoji: "🎯" },
  { id: "debt",     label: "Debt",      emoji: "💳" },
  { id: "networth", label: "Net Worth", emoji: "🏦" },
  { id: "settings", label: "Settings",  emoji: "⚙️" },
];

const CoveLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

function UserCard({ user, C, onSignOut, springs }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={hovered ? onSignOut : undefined}
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid ${hovered ? "rgba(255,59,48,0.3)" : C.border}`,
        background: hovered ? "rgba(255,59,48,0.06)" : C.surfaceAlt,
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer",
        transition: `all 250ms ${springs.snap}`,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0, boxShadow: `0 2px 8px ${C.accentGlow}` }}>
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: hovered ? "#FF3B30" : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: `color 200ms` }}>{user.name}</div>
        <div style={{ fontSize: 11, color: hovered ? "rgba(255,59,48,0.6)" : C.textMuted, transition: `color 200ms` }}>{user.currency}</div>
      </div>
      <div style={{ width: 1, height: 28, background: hovered ? "rgba(255,59,48,0.2)" : C.border, transition: `background 200ms`, flexShrink: 0 }} />
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={hovered ? "#FF3B30" : C.textMuted} strokeWidth="2.5" strokeLinecap="round"
        style={{ flexShrink: 0, transform: hovered ? "translateX(2px)" : "translateX(0)", transition: `all 250ms ${springs.bounce}` }}
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </div>
  );
}

export default function Sidebar({ active, setActive, onAdd, user, C, notifications, mobileOpen, onMobileClose, onSignOut, theme, onThemeToggle }) {
  const unread = notifications.filter(n => !n.read).length;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleNav = (id) => {
    setActive(id);
    if (isMobile) onMobileClose();
  };

  const W = collapsed ? 68 : 224;

  const sidebarContent = (
    <aside style={{
      width: W, minWidth: W, height: "100vh",
      background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", padding: "24px 0",
      position: isMobile ? "fixed" : "sticky",
      top: 0, left: 0, zIndex: isMobile ? 300 : "auto",
      transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
      transition: `width 280ms ${springs.snap}, transform 350ms ${springs.bounce}`,
      boxShadow: isMobile && mobileOpen ? "8px 0 40px rgba(0,0,0,0.5)" : "none",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{ padding: "0 14px 28px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`,
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px ${C.accentGlow}`,
          }}>
            <CoveLogo size={18} />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>Cove</span>
          )}
        </div>
        {!collapsed && !isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => handleNav("notifications")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              {unread > 0 && <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: C.expense, border: `2px solid ${C.surface}` }} />}
            </button>
          </div>
        )}
        {isMobile && !collapsed && (
          <button onClick={onMobileClose} style={{ background: C.surfaceAlt, border: "none", cursor: "pointer", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, fontSize: 16 }}>×</button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item, i) => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : ""}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 12, border: "none", cursor: "pointer",
                background: isActive ? C.accentSoft : "transparent",
                color: isActive ? C.accent : C.textSub,
                fontSize: 14, fontWeight: isActive ? 600 : 400, textAlign: "left",
                transition: `all 200ms ${springs.snap}`,
                width: "100%",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.color = C.text; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.emoji}</span>
              {!collapsed && item.label}
              {!collapsed && isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />}
            </button>
          );
        })}
      </nav>

      {/* Add Transaction */}
      <div style={{ padding: "12px 8px 10px" }}>
        <button onClick={() => { onAdd(); if (isMobile) onMobileClose(); }} style={{
          width: "100%", padding: collapsed ? "12px 0" : "12px", background: C.accent, color: "white",
          border: "none", borderRadius: 14, cursor: "pointer", fontSize: collapsed ? 20 : 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 8px 24px ${C.accentGlow}`, transition: `all 200ms ${springs.snap}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
        >{collapsed ? "+" : "+ Add Transaction"}</button>
      </div>

      {/* User + collapse toggle */}
      <div style={{ margin: "8px 8px 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {!collapsed && (
          <UserCard user={user} C={C} onSignOut={onSignOut} springs={springs} />
        )}
        {!isMobile && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setCollapsed(c => !c)} style={{
              flex: 1, padding: "10px 0", background: "none", border: `1px solid ${C.border}`,
              borderRadius: 12, cursor: "pointer", color: C.textMuted, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: `all 200ms ${springs.snap}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.textMuted; }}
            >
              {collapsed ? "→" : "← Collapse"}
            </button>
            {!collapsed && (
              <button onClick={onThemeToggle} title={theme === "dark" ? "Switch to light" : "Switch to dark"} style={{
                width: 40, padding: "10px 0", background: "none", border: `1px solid ${C.border}`,
                borderRadius: 12, cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: `all 200ms ${springs.snap}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            )}
          </div>
        )}
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
          }} />
        )}
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
}