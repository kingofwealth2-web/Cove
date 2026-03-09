import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { accentOptions } from "../tokens/colors";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

// Defined OUTSIDE SettingsScreen — if defined inside, React remounts them on every render, resetting scroll
function Toggle({ value, onChange, label, C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 14, color: C.text }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? C.accent : C.surfaceAlt,
        position: "relative", transition: "background 200ms", flexShrink: 0,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: value ? 21 : 3, transition: `left 200ms ${springs.bounce}`, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );
}

function Section({ title, children, C }) {
  return (
    <div style={{ background: C.surface, borderRadius: 20, padding: "20px 24px", border: `1px solid ${C.border}` }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function SettingsScreen({ user, setUser, C, setTheme, theme, accentChoice, setAccentChoice, onSignOut, transactions, categories, onDeleteAllData }) {
  const isMobile = useIsMobile();
  const [notifToggles, setNotifToggles] = useState({ budgetWarning: true, overBudget: true, billReminder: true, streak: true, monthlyRecap: true, anomaly: false });
  const [method, setMethod] = useState("envelope");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exportCSV = () => {
    const header = "Date,Type,Category,Amount,Note\n";
    const rows = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return `${tx.date},${tx.type},${cat?.name || ""},${tx.amount},"${(tx.note || "").replace(/"/g, '""')}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cove-transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = { transactions, categories, exportedAt: new Date().toISOString(), currency: user.currency };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cove-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Settings</h1>

      <Section title="Profile" C={C}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #818CF8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "white" }}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Personal · {user.currency}</div>
          </div>
        </div>
        <input placeholder="Your name" defaultValue={user.name} onBlur={e => setUser(u => ({ ...u, name: e.target.value }))}
          style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", marginBottom: 10 }} />
        <input placeholder="Email (optional)" style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none" }} />
      </Section>

      <Section title="Appearance" C={C}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 10 }}>Theme</div>
          <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
            {["dark","light"].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                background: theme === t ? C.surface : "transparent",
                color: theme === t ? C.text : C.textMuted, fontSize: 14, fontWeight: 500,
                boxShadow: theme === t ? C.shadow : "none", transition: `all 200ms ${springs.snap}`,
              }}>{t === "dark" ? "🌙 Dark" : "☀️ Light"}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 10 }}>Accent Color</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {accentOptions.map(a => (
              <button key={a.name} onClick={() => setAccentChoice(a)} style={{
                width: accentChoice.value === a.value ? 40 : 34, height: accentChoice.value === a.value ? 40 : 34,
                borderRadius: "50%", border: accentChoice.value === a.value ? `3px solid ${C.text}` : "none",
                background: a.value, cursor: "pointer",
                boxShadow: accentChoice.value === a.value ? `0 0 14px ${a.glow}` : "none",
                transition: `all 250ms ${springs.bounce}`,
              }} title={a.name} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Currency & Budget" C={C}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Currency</div>
          <select value={user.currency} onChange={e => setUser(u => ({ ...u, currency: e.target.value }))}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%" }}>
            {["GHS","USD","EUR","GBP","NGN","KES","ZAR","CAD","AUD"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>Budget Method</div>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
          {["envelope","flexible"].map(m => (
            <button key={m} onClick={() => setMethod(m)} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: method === m ? C.surface : "transparent",
              color: method === m ? C.text : C.textMuted, fontSize: 13, fontWeight: 500,
              textTransform: "capitalize", boxShadow: method === m ? C.shadow : "none",
              transition: `all 200ms ${springs.snap}`,
            }}>{m}</button>
          ))}
        </div>
      </Section>

      <Section title="Notifications" C={C}>
        {Object.entries(notifToggles).map(([key, val]) => {
          const labels = { budgetWarning: "80% budget warning", overBudget: "Over budget alert", billReminder: "Bill reminders", streak: "Logging streaks", monthlyRecap: "Monthly recap", anomaly: "Anomaly detection" };
          return <Toggle key={key} value={val} onChange={v => setNotifToggles(t => ({ ...t, [key]: v }))} label={labels[key]} C={C} />;
        })}
      </Section>

      <Section title="Security" C={C}>
        <Toggle value={pinEnabled} onChange={setPinEnabled} label="PIN Lock" C={C} />
        <Toggle value={false} onChange={() => {}} label="Biometric Login" C={C} />
      </Section>

      <Section title="Data" C={C}>
        {[
          { label: "Export as CSV", icon: "📥", action: exportCSV },
          { label: "Export as JSON", icon: "📤", action: exportJSON },
        ].map(item => (
          <button key={item.label} onClick={item.action} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 0",
            background: "none", border: "none", borderBottom: `1px solid ${C.border}`,
            cursor: "pointer", color: C.text, fontSize: 14, textAlign: "left", transition: "color 150ms",
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.accent}
          onMouseLeave={e => e.currentTarget.style.color = C.text}
          ><span>{item.icon}</span>{item.label}</button>
        ))}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 0", background: "none", border: "none", cursor: "pointer", color: C.expense, fontSize: 14, textAlign: "left" }}>
            <span>🗑</span>Delete All Data
          </button>
        ) : (
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>Are you sure? This cannot be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { onDeleteAllData(); setConfirmDelete(false); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.expense, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Delete Everything</button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Account" C={C}>
        <button onClick={onSignOut} style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 0",
          background: "none", border: "none", cursor: "pointer", color: C.expense, fontSize: 14, textAlign: "left",
        }}>
          <span>🚪</span>Sign Out
        </button>
      </Section>

      <Section title="About" C={C}>
        <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.8 }}>
          <div>Version 1.0.0</div>
          <div>Built with care. Designed for you.</div>
        </div>
      </Section>
    </div>
  );
}