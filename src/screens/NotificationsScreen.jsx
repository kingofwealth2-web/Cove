import { springs } from "../tokens/springs";


export default function NotificationsScreen({ notifications, setNotifications, C }) {
  const notifTypeColor = { warning: "warning", bill: "savings", streak: "income", recap: "accent", over: "expense" };
  const notifEmoji = { warning: "⚠️", bill: "📅", streak: "🔥", recap: "📊", over: "🚨", anomaly: "🤔" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: `slideUp 300ms ${springs.bounce}` }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Notifications</h1>
        <button onClick={() => setNotifications(ns => ns.map(n => ({ ...n, read: true })))}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.accent, fontWeight: 600 }}>Mark all read</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.map((n, i) => (
          <div key={n.id} onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{
            display: "flex", gap: 14, padding: "16px 20px",
            background: n.read ? C.surface : C.accentSoft,
            borderRadius: 16, border: `1px solid ${n.read ? C.border : C.accent + "30"}`,
            cursor: "pointer", transition: `all 200ms`,
            animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${i * 50}ms`,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{notifEmoji[n.type] || "🔔"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 700, color: C.text, marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS SCREEN
// ─────────────────────────────────────────────────────────────────────────────