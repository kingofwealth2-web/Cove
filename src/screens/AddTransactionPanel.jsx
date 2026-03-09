import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import SlidePanel from "../components/ui/SlidePanel";
import Label from "../components/ui/Label";

export default function AddTransactionPanel({ onClose, onSave, categories, user, C }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [freq, setFreq] = useState("monthly");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const numpad = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  const handleNum = k => {
    if (k === "⌫") setAmount(a => a.slice(0,-1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length > 9) return;
    else setAmount(a => a + k);
  };

  const canSave = parseFloat(amount) > 0 && (type === "income" || catId);

  const handleSave = () => {
    onSave({
      id: `t${Date.now()}`, categoryId: catId, amount: parseFloat(amount),
      type, note, date, isRecurring: recurring,
    });
    onClose();
  };

  return (
    <SlidePanel onClose={onClose} C={C} title="Log Transaction">
      {/* Type toggle */}
      <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
          {["expense","income"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
              background: type === t ? (t === "income" ? C.income : C.expense) : "transparent",
              color: type === t ? "white" : C.textSub,
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              transition: `all 200ms ${springs.snap}`,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Amount — text input on desktop, display + numpad on mobile */}
      {isMobile ? (
        <div style={{ padding: "24px 28px 16px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, letterSpacing: "-2px", color: amount ? C.text : C.textMuted, minHeight: 62 }}>
            {amount ? `${user.currency} ${amount}` : `${user.currency} 0.00`}
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 8 }}>Amount</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>{user.currency}</span>
            <input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSave && handleSave()}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 28, fontFamily: "'DM Serif Display', serif",
                color: C.text, letterSpacing: "-1px", width: "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Category */}
      {type === "expense" && (
        <div style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 10 }}>Category</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map(cat => (
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
      )}

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
                color: freq === f ? C.accent : C.textSub, fontSize: 13, fontWeight: 500,
                textTransform: "capitalize",
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
