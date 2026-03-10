import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { accentOptions } from "../tokens/colors";
import { supabase } from "../lib/supabase";
import Modal from "../components/ui/Modal";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

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

function PinSetupModal({ C, onClose, onSave }) {
  const [step, setStep] = useState("enter"); // enter | confirm
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  const handleKey = (key) => {
    if (step === "enter") {
      if (pin.length >= 4) return;
      const next = pin + key;
      setPin(next);
      if (next.length === 4) setTimeout(() => setStep("confirm"), 200);
    } else {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === pin) { onSave(pin); }
          else { setError("PINs don't match. Try again."); setConfirmPin(""); setPin(""); setStep("enter"); }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (step === "enter") setPin(p => p.slice(0,-1));
    else setConfirmPin(p => p.slice(0,-1));
  };

  const current = step === "enter" ? pin : confirmPin;

  return (
    <Modal onClose={onClose} C={C} width={360}>
      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: C.text, marginBottom: 6 }}>
            {step === "enter" ? "Set a PIN" : "Confirm PIN"}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {step === "enter" ? "Choose a 4-digit PIN to lock the app" : "Enter your PIN again to confirm"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: "50%",
              background: i < current.length ? C.accent : C.surfaceAlt,
              border: `2px solid ${i < current.length ? C.accent : C.border}`,
              transition: `all 150ms ${springs.snap}`,
            }} />
          ))}
        </div>

        {error && <div style={{ fontSize: 13, color: C.expense, textAlign: "center" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 64px)", gap: 12 }}>
          {keys.map((key, i) => (
            <button key={i} onClick={() => key === "⌫" ? handleDelete() : key ? handleKey(key) : null}
              disabled={!key}
              style={{
                width: 64, height: 64, borderRadius: "50%", border: "none",
                cursor: key ? "pointer" : "default",
                background: key ? C.surfaceAlt : "transparent",
                color: key === "⌫" ? C.textMuted : C.text,
                fontSize: key === "⌫" ? 18 : 22,
                fontFamily: "'DM Serif Display', serif",
                transition: `all 100ms ${springs.snap}`,
                opacity: key ? 1 : 0,
              }}
              onMouseDown={e => { if (key) e.currentTarget.style.transform = "scale(0.9)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >{key}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default function SettingsScreen({
  user, setUser, C, session,
  setTheme, theme, accentChoice, setAccentChoice,
  onSignOut, transactions, categories, onDeleteAllData,
  budgetMethod, onBudgetMethodChange,
  notifSettings, onNotifSettingsChange,
  pinHash, onSetPin, selectedYear, onImportTransactions,
}) {
  const isMobile = useIsMobile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [emailInput, setEmailInput] = useState(session?.user?.email || "");
  const [emailStatus, setEmailStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");

  const handleEmailSave = async () => {
    if (!emailInput || emailInput === session?.user?.email) return;
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) setEmailStatus("Error: " + error.message);
    else setEmailStatus("Check your new email to confirm the change.");
    setTimeout(() => setEmailStatus(""), 4000);
  };

  const handleRemovePin = () => { onSetPin(null); };

  const currentYear = new Date().getFullYear();
  const exportYear = selectedYear || currentYear;

  const exportCSV = () => {
    const yearTx = transactions.filter(t => new Date(t.date).getFullYear() === exportYear);
    const header = "Date,Type,Category,Amount,Note,Recurring\n";
    const rows = yearTx.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return `${tx.date},${tx.type},${cat?.name || ""},${tx.amount},"${(tx.note || "").replace(/"/g, '""')}",${tx.isRecurring ? "yes" : "no"}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cove-transactions-${exportYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const yearTx = transactions.filter(t => new Date(t.date).getFullYear() === exportYear);
    const data = { transactions: yearTx, categories, exportedAt: new Date().toISOString(), currency: user.currency, year: exportYear };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cove-data-${exportYear}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus(""); setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split("\n").filter(Boolean);
        const header = lines[0].toLowerCase();
        if (!header.includes("date") || !header.includes("amount")) {
          setImportError("CSV must have Date and Amount columns."); return;
        }
        const cols = lines[0].split(",").map(c => c.trim().toLowerCase().replace(/"/g, ""));
        const dateIdx = cols.indexOf("date");
        const typeIdx = cols.indexOf("type");
        const catIdx = cols.indexOf("category");
        const amtIdx = cols.indexOf("amount");
        const noteIdx = cols.indexOf("note");

        // Robust CSV line splitter — handles quoted fields with commas
        const splitCSVLine = (line) => {
          const out = []; let cur = ""; let inQ = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQ = !inQ;
            else if (line[i] === ',' && !inQ) { out.push(cur.trim()); cur = ""; }
            else cur += line[i];
          }
          out.push(cur.trim());
          return out;
        };

        const parsed = lines.slice(1).map(line => {
          const clean = splitCSVLine(line);
          const catName = clean[catIdx] || "";
          const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          return {
            date: clean[dateIdx] || new Date().toISOString().split("T")[0],
            type: (clean[typeIdx] || "expense").toLowerCase(),
            categoryId: cat?.id || categories[0]?.id,
            amount: parseFloat(clean[amtIdx]) || 0,
            note: clean[noteIdx] || "",
            isRecurring: false,
          };
        }).filter(t => t.amount > 0 && t.date);

        if (parsed.length === 0) { setImportError("No valid transactions found."); return; }
        onImportTransactions && onImportTransactions(parsed);
        setImportStatus(`✓ Imported ${parsed.length} transaction${parsed.length !== 1 ? "s" : ""}`);
        setTimeout(() => setImportStatus(""), 4000);
      } catch (err) {
        setImportError("Failed to parse CSV. Check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const notifLabels = {
    budgetWarning: "80% budget warning",
    overBudget: "Over budget alert",
    billReminder: "Bill reminders",
    streak: "Logging streaks",
    monthlyRecap: "Monthly recap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Settings</h1>

      <Section title="Profile" C={C}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #818CF8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "white" }}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>{session?.user?.email}</div>
          </div>
        </div>
        <input placeholder="Your name" defaultValue={user.name} onBlur={e => setUser(u => ({ ...u, name: e.target.value }))}
          style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email" placeholder="Email address" value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none" }}
          />
          <button onClick={handleEmailSave} style={{
            padding: "11px 16px", borderRadius: 12, border: "none",
            background: C.accent, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap",
          }}>Update</button>
        </div>
        {emailStatus && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{emailStatus}</div>}
      </Section>

      <Section title="Appearance" C={C}>
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
            <button key={m} onClick={() => onBudgetMethodChange(m)} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: budgetMethod === m ? C.surface : "transparent",
              color: budgetMethod === m ? C.text : C.textMuted, fontSize: 13, fontWeight: 500,
              textTransform: "capitalize", boxShadow: budgetMethod === m ? C.shadow : "none",
              transition: `all 200ms ${springs.snap}`,
            }}>{m === "envelope" ? "📬 Envelope" : "🔓 Flexible"}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
          {budgetMethod === "envelope" ? "Hard limits — spending stops at your budget." : "Soft limits — track without restrictions."}
        </div>
      </Section>

      <Section title="Notifications" C={C}>
        {Object.entries(notifLabels).map(([key, label]) => (
          <Toggle key={key} value={notifSettings[key] ?? true} onChange={v => onNotifSettingsChange({ ...notifSettings, [key]: v })} label={label} C={C} />
        ))}
      </Section>

      <Section title="Security" C={C}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 14, color: C.text }}>PIN Lock</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{pinHash ? "App is locked on open" : "Require a PIN to open the app"}</div>
          </div>
          {pinHash ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPinSetup(true)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 13, cursor: "pointer" }}>Change</button>
              <button onClick={handleRemovePin} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: C.expense + "22", color: C.expense, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Remove</button>
            </div>
          ) : (
            <button onClick={() => setShowPinSetup(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: C.accent, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enable</button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0" }}>
          <div>
            <div style={{ fontSize: 14, color: C.text }}>Biometric Login</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Coming soon</div>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, background: C.surfaceAlt, padding: "4px 10px", borderRadius: 99 }}>Soon</div>
        </div>
      </Section>

      <Section title="Data" C={C}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
          Exporting {exportYear} data ({transactions.filter(t => new Date(t.date).getFullYear() === exportYear).length} transactions)
        </div>
        {[
          { label: `Export ${exportYear} as CSV`, icon: "📥", action: exportCSV },
          { label: `Export ${exportYear} as JSON`, icon: "📤", action: exportJSON },
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

        {/* CSV Import */}
        <div style={{ paddingTop: 4, paddingBottom: 4, borderBottom: `1px solid ${C.border}` }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 0", cursor: "pointer", color: C.text, fontSize: 14 }}
            onMouseEnter={e => e.currentTarget.style.color = C.accent}
            onMouseLeave={e => e.currentTarget.style.color = C.text}>
            <span>📂</span>Import from CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: "none" }} />
          </label>
          {importStatus && <div style={{ fontSize: 12, color: C.income, paddingBottom: 8 }}>{importStatus}</div>}
          {importError && <div style={{ fontSize: 12, color: C.expense, paddingBottom: 8 }}>{importError}</div>}
          <div style={{ fontSize: 12, color: C.textMuted, paddingBottom: 8 }}>
            CSV must have: Date, Type (income/expense), Category, Amount, Note columns.
          </div>
        </div>

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

      {showPinSetup && (
        <PinSetupModal C={C} onClose={() => setShowPinSetup(false)} onSave={(pin) => { onSetPin(pin); setShowPinSetup(false); }} />
      )}
    </div>
  );
}