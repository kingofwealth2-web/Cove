import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import SlidePanel from "../components/ui/SlidePanel";
import Label from "../components/ui/Label";

export default function AddTransactionPanel({ onClose, onSave, categories, user, C, fxRates = {} }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [freq, setFreq] = useState("monthly");
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency);
  const [customRate, setCustomRate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // When currency changes, prefill stored rate
  useEffect(() => {
    if (selectedCurrency !== user.currency) {
      setCustomRate(String(fxRates[selectedCurrency] || ""));
    } else {
      setCustomRate("");
    }
  }, [selectedCurrency]);

  const availableCurrencies = [user.currency, ...Object.keys(fxRates).filter(c => c !== user.currency)];
  const isForeign = selectedCurrency !== user.currency;
  const rate = isForeign ? (parseFloat(customRate) || fxRates[selectedCurrency] || 1) : 1;
  const parsedAmount = parseFloat(amount) || 0;
  const baseAmount = isForeign ? parsedAmount * rate : parsedAmount;

  const numpad = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  const handleNum = k => {
    if (k === "⌫") setAmount(a => a.slice(0,-1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length > 9) return;
    else setAmount(a => a + k);
  };

  const canSave = parsedAmount > 0 && catId;

  const handleSave = () => {
    onSave({
      id: `t${Date.now()}`,
      categoryId: catId,
      amount: isForeign ? baseAmount : parsedAmount,
      type, note, date, isRecurring: recurring,
      originalCurrency: isForeign ? selectedCurrency : null,
      originalAmount: isForeign ? parsedAmount : null,
      exchangeRate: isForeign ? rate : 1,
    });
    onClose();
  };

  return (
    <SlidePanel onClose={onClose} C={C} title="Log Transaction">
      {/* Type toggle */}
      <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
          {["expense","income"].map(t => (
            <button key={t} onClick={() => { setType(t); setCatId(null); }} style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
              background: type === t ? (t === "income" ? C.income : C.expense) : "transparent",
              color: type === t ? "white" : C.textSub,
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              transition: `all 200ms ${springs.snap}`,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Currency selector (shown when multiple currencies available) */}
      {availableCurrencies.length > 1 && (
        <div style={{ padding: "12px 28px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {availableCurrencies.map(c => (
            <button key={c} onClick={() => setSelectedCurrency(c)} style={{
              padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: selectedCurrency === c ? C.accent : C.surfaceAlt,
              color: selectedCurrency === c ? "white" : C.textSub,
              transition: `all 150ms ${springs.snap}`,
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* Amount */}
      {isMobile ? (
        <div style={{ padding: "24px 28px 16px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, letterSpacing: "-2px", color: amount ? C.text : C.textMuted, minHeight: 62 }}>
            {amount ? `${selectedCurrency} ${amount}` : `${selectedCurrency} 0.00`}
          </div>
          {isForeign && parsedAmount > 0 && (
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              = {user.currency} {baseAmount.toFixed(2)}
              {customRate && <span style={{ marginLeft: 6, color: C.accent }}>@ {rate}</span>}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 8 }}>Amount</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>{selectedCurrency}</span>
            <input
              autoFocus
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSave && handleSave()}
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 28, fontFamily: "'DM Serif Display', serif", color: C.text, letterSpacing: "-1px", width: "100%" }}
            />
          </div>
          {/* FX rate + converted amount */}
          {isForeign && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "10px 14px", background: C.accentSoft, borderRadius: 12, border: `1px solid ${C.accent}22` }}>
              <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>1 {selectedCurrency} =</span>
              <input
                type="number" min="0" step="0.01" placeholder="rate"
                value={customRate} onChange={e => setCustomRate(e.target.value)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 13, color: C.text, outline: "none", width: 80, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
              />
              <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
              {parsedAmount > 0 && rate > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginLeft: 4 }}>→ {user.currency} {baseAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile: FX rate row */}
      {isMobile && isForeign && (
        <div style={{ padding: "10px 28px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>Rate: 1 {selectedCurrency} =</span>
          <input
            type="number" min="0" step="0.01" placeholder="rate"
            value={customRate} onChange={e => setCustomRate(e.target.value)}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 13, color: C.text, outline: "none", width: 90, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
          />
          <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
        </div>
      )}

      {/* Category */}
      <div style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}` }}>
        <Label C={C} style={{ marginBottom: 10 }}>Category</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories
            .filter(cat => type === "income" ? cat.is_income : !cat.is_income)
            .map(cat => (
              <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
                padding: "7px 13px", borderRadius: 99,
                border: `1px solid ${catId === cat.id ? cat.color + "60" : "transparent"}`,
                background: catId === cat.id ? cat.color + "22" : C.surfaceAlt,
                color: catId === cat.id ? cat.color : C.textSub,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                transition: `all 200ms ${springs.snap}`,
              }}>
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
        </div>
      </div>

      {/* Note, date, recurring */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%" }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", colorScheme: "dark" }} />
        <button onClick={() => setRecurring(r => !r)} style={{
          display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
          cursor: "pointer", color: C.textSub, fontSize: 14, padding: 0, textAlign: "left",
        }}>
          <div style={{ width: 40, height: 24, borderRadius: 99, background: recurring ? C.accent : C.surfaceAlt, position: "relative", transition: `background 200ms`, border: `1px solid ${C.border}` }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: recurring ? 18 : 2, transition: `left 200ms ${springs.bounce}`, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
          </div>
          Repeat this transaction
        </button>
        {recurring && (
          <div style={{ display: "flex", gap: 8 }}>
            {["weekly","monthly","yearly"].map(f => (
              <button key={f} onClick={() => setFreq(f)} style={{
                padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: freq === f ? C.accentSoft : C.surfaceAlt,
                color: freq === f ? C.accent : C.textSub, fontSize: 13, fontWeight: 500, textTransform: "capitalize",
              }}>{f}</button>
            ))}
          </div>
        )}
      </div>

      {/* Numpad — mobile only */}
      {isMobile && (
        <div style={{ padding: "14px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {numpad.map(k => (
              <button key={k} onClick={() => handleNum(k)} style={{
                padding: "15px", borderRadius: 14, border: "none",
                background: C.surfaceAlt, color: C.text, fontSize: 18, fontWeight: 600, cursor: "pointer",
                transition: `transform 100ms ${springs.snap}`,
              }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >{k}</button>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <div style={{ padding: "8px 28px 28px" }}>
        <button disabled={!canSave} onClick={handleSave} style={{
          width: "100%", padding: "15px", borderRadius: 14, border: "none",
          background: canSave ? C.accent : C.surfaceAlt,
          color: canSave ? "white" : C.textMuted,
          fontSize: 15, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed",
          boxShadow: canSave ? `0 8px 24px ${C.accentGlow}` : "none",
          transition: `all 200ms ${springs.snap}`,
        }}>Save Transaction</button>
      </div>
    </SlidePanel>
  );
}