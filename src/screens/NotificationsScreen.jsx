import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

export default function NotificationsScreen({ notifications, setNotifications, C }) {
  const isMobile = useIsMobile();
  const notifEmoji = { warning: "⚠️", bill: "📅", streak: "🔥", recap: "📊", over: "🚨", anomaly: "🤔" };

  const unread = notifications.filter(n => !n.read).length;

  const markRead = (id) => setNotifications(ns => ns.map(x => x.id === id ? { ...x, read: true } : x));
  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const dismiss = (id) => setNotifications(ns => ns.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: `slideUp 300ms ${springs.bounce}` }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Notifications</h1>
          {unread > 0 && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{unread} unread</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{
              background: C.accentSoft, border: "none", cursor: "pointer",
              fontSize: 12, color: C.accent, fontWeight: 700,
              padding: "7px 12px", borderRadius: 10,
            }}>✓ Mark all read</button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} style={{
              background: C.expenseSoft, border: "none", cursor: "pointer",
              fontSize: 12, color: C.expense, fontWeight: 700,
              padding: "7px 12px", borderRadius: 10,
            }}>🗑 Clear all</button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: "52px 24px", border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>All caught up</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>No notifications right now.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n, i) => (
            <div key={n.id} style={{
              display: "flex", gap: 14, padding: "16px 20px",
              background: n.read ? C.surface : C.accentSoft,
              borderRadius: 16, border: `1px solid ${n.read ? C.border : C.accent + "30"}`,
              transition: `all 200ms`,
              animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${i * 40}ms`,
              cursor: "pointer",
            }} onClick={() => markRead(n.id)}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{notifEmoji[n.type] || "🔔"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 700, color: C.text, marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{n.time}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />}
                <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.textMuted, fontSize: 14, padding: "2px 4px", borderRadius: 6,
                  lineHeight: 1,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = C.expense}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}