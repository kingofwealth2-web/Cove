import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { accentOptions } from "../tokens/colors";
import { supabase } from "../lib/supabase";
import { hashPin } from "../lib/pinUtils";
import { isBiometricAvailable, registerBiometric } from "../lib/biometricUtils";
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

function PinPad({ value, onChange, onDelete, C }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <>
      <div style={{ display: "flex", gap: 14 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: "50%",
            background: i < value.length ? C.accent : C.surfaceAlt,
            border: `2px solid ${i < value.length ? C.accent : C.border}`,
            transition: `all 150ms ${springs.snap}`,
          }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 64px)", gap: 12 }}>
        {keys.map((key, i) => (
          <button key={i}
            onClick={() => key === "⌫" ? onDelete() : key ? onChange(key) : null}
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
    </>
  );
}

// mode: "enable" | "change" | "remove"
function PinSetupModal({ C, onClose, onSave, onRemove, mode, existingHash }) {
  // Steps:
  //   enable: enter → confirm
  //   change: verify → enter → confirm
  //   remove: verify → done
  const initialStep = (mode === "enable") ? "enter" : "verify";
  const [step, setStep] = useState(initialStep);
  const [verifyPin, setVerifyPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const stepTitles = {
    verify: mode === "remove" ? "Confirm your PIN" : "Enter current PIN",
    enter: "Set new PIN",
    confirm: "Confirm new PIN",
  };
  const stepSubtitles = {
    verify: "Enter your existing PIN to continue",
    enter: "Choose a 4-digit PIN",
    confirm: "Enter your new PIN again to confirm",
  };

  const currentValue = step === "verify" ? verifyPin : step === "enter" ? newPin : confirmPin;

  const handleChange = async (key) => {
    if (step === "verify") {
      if (verifyPin.length >= 4) return;
      const next = verifyPin + key;
      setVerifyPin(next);
      if (next.length === 4) {
        setVerifying(true);
        setTimeout(async () => {
          const hashed = await hashPin(next);
          if (hashed === existingHash) {
            setError("");
            if (mode === "remove") { onRemove(); }
            else { setStep("enter"); }
          } else {
            setError("Incorrect PIN. Try again.");
            setVerifyPin("");
          }
          setVerifying(false);
        }, 200);
      }
    } else if (step === "enter") {
      if (newPin.length >= 4) return;
      const next = newPin + key;
      setNewPin(next);
      if (next.length === 4) setTimeout(() => setStep("confirm"), 200);
    } else {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === newPin) { onSave(newPin); }
          else { setError("PINs don't match. Try again."); setConfirmPin(""); setNewPin(""); setStep("enter"); }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (step === "verify") setVerifyPin(p => p.slice(0, -1));
    else if (step === "enter") setNewPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  return (
    <Modal onClose={onClose} C={C} width={360}>
      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: C.text, marginBottom: 6 }}>
            {stepTitles[step]}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {stepSubtitles[step]}
          </div>
        </div>
        <PinPad value={currentValue} onChange={handleChange} onDelete={handleDelete} C={C} />
        {error && <div style={{ fontSize: 13, color: C.expense, textAlign: "center", marginTop: -12 }}>{error}</div>}
        {verifying && <div style={{ fontSize: 13, color: C.textMuted }}>Checking…</div>}
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
  pinHash, onSetPin, biometricCredentials = [], onEnableBiometric, onDisableBiometric,
  selectedYear, onImportTransactions, fxRates = {}, onSaveFxRates, lastSyncedAt,
  assets = [], setAssets, liabilities = [], setLiabilities,
}) {
  const isMobile = useIsMobile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pinModal, setPinModal] = useState(null);
  const [emailInput, setEmailInput] = useState(session?.user?.email || "");
  const [emailStatus, setEmailStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");
  const [newFxCurrency, setNewFxCurrency] = useState("");
  const [newFxRate, setNewFxRate] = useState("");
  const [fxFetching, setFxFetching] = useState(false);
  const [fxError, setFxError] = useState("");
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [bioStatus, setBioStatus] = useState("");
  const [installable, setInstallable] = useState(!!window.__pwaPrompt);
  const [installDone, setInstallDone] = useState(false);

  // Opening balances local edit state
  const [obEdits, setObEdits] = useState({});
  const [obSaving, setObSaving] = useState(false);
  const [obSaved, setObSaved] = useState(false);

  // Build a flat map of { id: value } for all assets + liabilities
  const getObValue = (id) => {
    if (obEdits[id] !== undefined) return obEdits[id];
    const asset = assets.find(a => a.id === id);
    if (asset) return String(asset.value);
    const liab = liabilities.find(l => l.id === id);
    if (liab) return String(liab.balance);
    return "";
  };

  const handleObSave = async () => {
    if (!setAssets || !setLiabilities) return;
    setObSaving(true);
    // Apply edits to assets
    const newAssets = assets.map(a =>
      obEdits[a.id] !== undefined ? { ...a, value: parseFloat(obEdits[a.id]) || 0 } : a
    );
    // Apply edits to liabilities
    const newLiabs = liabilities.map(l =>
      obEdits[l.id] !== undefined ? { ...l, balance: parseFloat(obEdits[l.id]) || 0 } : l
    );
    await Promise.all([setAssets(newAssets), setLiabilities(newLiabs)]);
    setObEdits({});
    setObSaving(false);
    setObSaved(true);
    setTimeout(() => setObSaved(false), 2500);
  };

  const hasObEdits = Object.keys(obEdits).length > 0;

  useEffect(() => {
    const check = () => setInstallable(!!window.__pwaPrompt);
    window.addEventListener("beforeinstallprompt", check);
    return () => window.removeEventListener("beforeinstallprompt", check);
  }, []);

  const handleInstall = async () => {
    if (!window.__pwaPrompt) return;
    window.__pwaPrompt.prompt();
    const { outcome } = await window.__pwaPrompt.userChoice;
    if (outcome === "accepted") { setInstallDone(true); window.__pwaPrompt = null; }
  };

  const handleEmailSave = async () => {
    if (!emailInput || emailInput === session?.user?.email) return;
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) setEmailStatus("Error: " + error.message);
    else setEmailStatus("Check your new email to confirm the change.");
    setTimeout(() => setEmailStatus(""), 4000);
  };

  const handleRemovePin = () => { onSetPin(null); setPinModal(null); };

  // Load available currency list once for the picker
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { if (d.rates) setAvailableCurrencies(Object.keys(d.rates).sort()); })
      .catch(() => {});
  }, []);

  const fetchLiveRates = async () => {
    setFxFetching(true);
    setFxError("");
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${user.currency}`);
      const data = await res.json();
      if (data.result !== "success" || !data.rates) {
        setFxError(`Could not fetch rates for ${user.currency}. Try updating manually.`);
        setFxFetching(false); return;
      }
      // Build updated rates: keep existing configured currencies, update their values
      // Also keep any user-added currencies that the API knows about
      const existing = Object.keys(fxRates).filter(c => c !== "_updatedAt");
      const toUpdate = existing.length > 0 ? existing : Object.keys(data.rates).slice(0, 5);
      const updated = { ...fxRates };
      let updatedCount = 0;
      toUpdate.forEach(code => {
        if (data.rates[code]) {
          updated[code] = parseFloat((1 / data.rates[code]).toFixed(6));
          updatedCount++;
        }
      });
      updated._updatedAt = new Date().toISOString();
      onSaveFxRates && await onSaveFxRates(updated);
      setFxFetching(false);
    } catch (e) {
      setFxError("Network error. Check your connection.");
      setFxFetching(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const exportYear = selectedYear || currentYear;

  const handleEnableBiometrics = async () => {
    setBioStatus("enabling");
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setBioStatus("error:This device doesn't support biometric authentication.");
        return;
      }
      // Need the Supabase user ID to register — get it from session
      const { data: { user } } = await supabase.auth.getUser();
      const credential = await registerBiometric(user.id);
      await onEnableBiometric(credential);
      setBioStatus("");
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setBioStatus("error:Biometric setup was cancelled.");
      } else {
        setBioStatus("error:Could not set up biometrics. Try again.");
      }
    }
  };

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

      {/* Install App — Android Chrome */}
      {(installable || installDone) && (
        <div style={{
          background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
          border: `1px solid ${C.accent}40`, borderRadius: 18,
          padding: "18px 22px", display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>📲</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>
              {installDone ? "Cove installed! ✓" : "Install Cove on your device"}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted }}>
              {installDone ? "Find Cove on your home screen." : "Add to your home screen for the best experience — works offline too."}
            </div>
          </div>
          {!installDone && (
            <button onClick={handleInstall} style={{
              padding: "10px 18px", borderRadius: 12, border: "none",
              background: C.accent, color: "white",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 16px ${C.accentGlow}`, whiteSpace: "nowrap",
            }}>Install</button>
          )}
        </div>
      )}

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

      <Section title="Foreign Currencies" C={C}>
        {/* Header: description + fetch button */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              Log transactions in other currencies — amounts are auto-converted to {user.currency}.
            </div>
            {fxRates._updatedAt && (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                Rates updated {(() => {
                  const diff = Math.round((Date.now() - new Date(fxRates._updatedAt)) / 60000);
                  if (diff < 2) return "just now";
                  if (diff < 60) return `${diff} min ago`;
                  if (diff < 1440) return `${Math.round(diff/60)}h ago`;
                  return `${Math.round(diff/1440)}d ago`;
                })()}
              </div>
            )}
          </div>
          <button onClick={fetchLiveRates} disabled={fxFetching} style={{
            padding: "8px 14px", borderRadius: 10, border: "none", cursor: fxFetching ? "default" : "pointer",
            background: fxFetching ? C.surfaceAlt : C.accentSoft,
            color: fxFetching ? C.textMuted : C.accent,
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            transition: `all 200ms ${springs.snap}`,
          }}>
            {fxFetching ? "Fetching…" : "↻ Live rates"}
          </button>
        </div>

        {fxError && <div style={{ fontSize: 12, color: C.expense, marginBottom: 10, padding: "8px 12px", background: C.expenseSoft, borderRadius: 10 }}>{fxError}</div>}

        {/* Existing rates */}
        {Object.entries(fxRates).filter(([k]) => k !== "_updatedAt").map(([currency, rate]) => (
          <div key={currency} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 44 }}>{currency}</span>
            <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>1 {currency} =</span>
            <input
              type="number" min="0" step="0.0001"
              key={`${currency}-${rate}`}
              defaultValue={typeof rate === "number" ? rate.toFixed(4) : rate}
              onBlur={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  const updated = { ...fxRates, [currency]: val };
                  onSaveFxRates && onSaveFxRates(updated);
                }
              }}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 13, color: C.text, outline: "none", width: 100, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
            />
            <span style={{ fontSize: 12, color: C.textMuted, width: 36 }}>{user.currency}</span>
            <button onClick={() => {
              const updated = { ...fxRates };
              delete updated[currency];
              onSaveFxRates && onSaveFxRates(updated);
            }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 14, padding: "2px 6px", borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = C.expense}
              onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
            >✕</button>
          </div>
        ))}

        {/* Add new currency */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <select
            value={newFxCurrency}
            onChange={e => setNewFxCurrency(e.target.value)}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px", fontSize: 13, color: newFxCurrency ? C.text : C.textMuted, outline: "none", flex: 1 }}
          >
            <option value="">Currency…</option>
            {(availableCurrencies.length > 0 ? availableCurrencies : ["USD","EUR","GBP","NGN","KES","ZAR","CAD","AUD","JPY","CNY","INR"])
              .filter(c => c !== user.currency && !fxRates[c])
              .map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={async () => {
            const code = newFxCurrency.trim().toUpperCase();
            if (!code || code === user.currency) return;
            // Try to fetch live rate first
            try {
              const res = await fetch(`https://open.er-api.com/v6/latest/${user.currency}`);
              const data = await res.json();
              if (data.rates?.[code]) {
                const liveRate = parseFloat((1 / data.rates[code]).toFixed(6));
                const updated = { ...fxRates, [code]: liveRate, _updatedAt: new Date().toISOString() };
                onSaveFxRates && onSaveFxRates(updated);
                setNewFxCurrency("");
                return;
              }
            } catch {}
            // Fallback: add with rate 1 for manual entry
            const updated = { ...fxRates, [code]: 1 };
            onSaveFxRates && onSaveFxRates(updated);
            setNewFxCurrency("");
          }} disabled={!newFxCurrency} style={{
            padding: "9px 18px", background: newFxCurrency ? C.accent : C.surfaceAlt,
            color: newFxCurrency ? "white" : C.textMuted,
            border: "none", borderRadius: 10, cursor: newFxCurrency ? "pointer" : "not-allowed",
            fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
            transition: `all 150ms ${springs.snap}`,
          }}>+ Add</button>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
          Adding a currency fetches its current rate automatically.
        </div>
      </Section>

      <Section title="My Accounts" C={C}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
          Your account balances at a glance. Update any value to keep your net worth accurate.
        </div>

        {/* Assets */}
        {assets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Money you have</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assets.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12, border: `1px solid ${obEdits[a.id] !== undefined ? C.accent + "60" : C.border}` }}>
                  <span style={{ fontSize: 18 }}>
                    {{ cash: "📱", savings: "🏦", property: "🏠", investment: "📈", vehicle: "🚗", other: "📦" }[a.type] || "📦"}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: C.text }}>{a.name}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
                  <input type="number" min="0"
                    value={getObValue(a.id)}
                    onChange={e => setObEdits(prev => ({ ...prev, [a.id]: e.target.value }))}
                    style={{ width: 100, padding: "7px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: "none", textAlign: "right" }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liabilities */}
        {liabilities.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Money you owe</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {liabilities.map(l => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12, border: `1px solid ${obEdits[l.id] !== undefined ? "#FF375F40" : C.border}` }}>
                  <span style={{ fontSize: 18 }}>
                    {{ loan: "📋", credit_card: "💳", mortgage: "🏠", other: "📦" }[l.type] || "📦"}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: C.text }}>{l.name}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
                  <input type="number" min="0"
                    value={getObValue(l.id)}
                    onChange={e => setObEdits(prev => ({ ...prev, [l.id]: e.target.value }))}
                    style={{ width: 100, padding: "7px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: "none", textAlign: "right" }}
                    onFocus={e => e.target.style.borderColor = "#FF375F"}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {assets.length === 0 && liabilities.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: C.textMuted, fontSize: 14, background: C.surfaceAlt, borderRadius: 12 }}>
            No opening balances set. Add assets and liabilities in the Net Worth screen.
          </div>
        )}

        {(assets.length > 0 || liabilities.length > 0) && (
          <button
            onClick={handleObSave}
            disabled={!hasObEdits || obSaving}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none", marginTop: 4,
              background: obSaved ? C.income : (!hasObEdits || obSaving) ? C.surfaceAlt : C.accent,
              color: obSaved ? "white" : (!hasObEdits || obSaving) ? C.textMuted : "white",
              fontSize: 14, fontWeight: 700,
              cursor: (!hasObEdits || obSaving) ? "default" : "pointer",
              transition: "all 300ms",
              boxShadow: (!hasObEdits || obSaving) ? "none" : `0 4px 16px ${C.accentGlow}`,
            }}
          >
            {obSaved ? "✓ Saved" : obSaving ? "Saving…" : "Save changes"}
          </button>
        )}
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
              <button onClick={() => setPinModal("change")} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 13, cursor: "pointer" }}>Change</button>
              <button onClick={() => setPinModal("remove")} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: C.expense + "22", color: C.expense, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Remove</button>
            </div>
          ) : (
            <button onClick={() => setPinModal("enable")} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: C.accent, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enable</button>
          )}
        </div>
        <div style={{ paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, color: C.text }}>Biometric Login</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                {biometricCredentials.length > 0
                  ? `${biometricCredentials.length} device${biometricCredentials.length !== 1 ? "s" : ""} registered`
                  : "Use Face ID, Touch ID, or fingerprint to unlock"}
              </div>
            </div>
            <button onClick={handleEnableBiometrics} disabled={bioStatus === "enabling" || !pinHash} style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: (bioStatus === "enabling" || !pinHash) ? C.surfaceAlt : C.accent,
              color: (bioStatus === "enabling" || !pinHash) ? C.textMuted : "white",
              fontSize: 13, fontWeight: 600,
              cursor: (bioStatus === "enabling" || !pinHash) ? "default" : "pointer",
              flexShrink: 0,
            }}>
              {bioStatus === "enabling" ? "Setting up…" : "+ Add This Device"}
            </button>
          </div>

          {/* Registered devices list */}
          {biometricCredentials.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {biometricCredentials.map((cred) => (
                <div key={cred.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  background: C.surfaceAlt, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 20 }}>
                    {/iPhone|iPad/.test(cred.label) ? "📱"
                      : /Mac/.test(cred.label) ? "💻"
                      : /Android/.test(cred.label) ? "📱"
                      : /Windows/.test(cred.label) ? "🖥️"
                      : "🔐"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{cred.label}</div>
                    {cred.addedAt && (
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        Added {new Date(cred.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onDisableBiometric && onDisableBiometric(cred.id)} style={{
                    padding: "6px 12px", borderRadius: 8, border: "none",
                    background: C.expense + "22", color: C.expense,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {bioStatus.startsWith("error:") && (
            <div style={{ fontSize: 12, color: C.expense, marginTop: 8, padding: "6px 10px", background: C.expenseSoft, borderRadius: 8 }}>
              {bioStatus.slice(6)}
            </div>
          )}
          {!pinHash && (
            <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8, marginTop: 8 }}>
              Set up a PIN first — biometrics acts as an alternative unlock method.
            </div>
          )}
        </div>
      </Section>

      <Section title="Data" C={C}>
        {/* Backup status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 14, marginBottom: 16,
          background: lastSyncedAt ? C.incomeSoft || C.accentSoft : C.surfaceAlt,
          border: `1px solid ${lastSyncedAt ? C.income + "40" : C.border}`,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
            background: lastSyncedAt ? C.income : C.textMuted,
            boxShadow: lastSyncedAt ? `0 0 8px ${C.income}88` : "none",
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {lastSyncedAt ? "Your data is backed up" : "Syncing…"}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {lastSyncedAt
                ? `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Stored securely in Supabase`
                : "Connecting to your account…"}
            </div>
          </div>
          <span style={{ fontSize: 18 }}>{lastSyncedAt ? "☁️" : "⏳"}</span>
        </div>

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

      {pinModal && (
        <PinSetupModal
          C={C}
          mode={pinModal}
          existingHash={pinHash}
          onClose={() => setPinModal(null)}
          onSave={(pin) => { onSetPin(pin); setPinModal(null); }}
          onRemove={handleRemovePin}
        />
      )}
    </div>
  );
}