import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { useCountUp } from "../hooks/useCountUp";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import Label from "../components/ui/Label";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}



function DebtCard({ debt, i, user, C, onPayment }) {
  const paidPct = ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100;
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.surface, borderRadius: 20, padding: "20px 24px",
      border: `1px solid ${hov ? C.borderStrong : C.border}`,
      boxShadow: hov ? C.shadowLg : C.shadow,
      transform: hov ? "translateY(-2px)" : "translateY(0)",
      transition: `all 200ms ${springs.snap}`,
      animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${200 + i * 50}ms`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{debt.lender}</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.surfaceAlt, padding: "3px 10px", borderRadius: 99, textTransform: "capitalize" }}>{debt.type.replace("_", " ")}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.expense, letterSpacing: "-0.5px" }}>{user.currency} {debt.currentBalance.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>of {user.currency} {debt.originalAmount.toLocaleString()}</div>
        </div>
      </div>
      <ProgressBar value={debt.originalAmount - debt.currentBalance} max={debt.originalAmount} color={C.income} delay={220 + i * 50} C={C} height={6} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        {[
          { label: "INTEREST", value: debt.interestRate + "%", color: C.warning },
          { label: "MIN PAYMENT", value: user.currency + " " + debt.minimumPayment, color: C.text },
          { label: "DUE DAY", value: debt.dueDay + "th", color: C.text },
          { label: "PAID OFF", value: Math.round(paidPct) + "%", color: C.income },
        ].map(item => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
      <button onClick={() => onPayment(debt.id)} style={{
        marginTop: 14, width: "100%", padding: "10px", background: C.accentSoft, color: C.accent,
        border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 13,
      }}>Make Payment</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export default function DebtScreen({ debts, setDebts, user, C }) {
  const isMobile = useIsMobile();
  const [method, setMethod] = useState("snowball");
  const [showAdd, setShowAdd] = useState(false);
  const [newDebt, setNewDebt] = useState({ lender: "", originalAmount: "", currentBalance: "", interestRate: "", minimumPayment: "", dueDay: "", type: "loan" });
  const [makePayment, setMakePayment] = useState(null);
  const [payAmt, setPayAmt] = useState("");

  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalDebtNum = useCountUp(totalDebt, 700, 200, [totalDebt]);

  const sorted = method === "snowball"
    ? [...debts].sort((a, b) => a.currentBalance - b.currentBalance)
    : [...debts].sort((a, b) => b.interestRate - a.interestRate);

  const payoffMonths = (balance, rate, payment) => {
    if (payment <= 0) return Infinity;
    const r = rate / 100 / 12;
    if (r === 0) return Math.ceil(balance / payment);
    return Math.ceil(-Math.log(1 - (balance * r) / payment) / Math.log(1 + r));
  };

  const totalInterest = debts.reduce((s, d) => {
    const r = d.interestRate / 100 / 12;
    const months = payoffMonths(d.currentBalance, d.interestRate, d.minimumPayment);
    if (!isFinite(months)) return s;
    return s + (d.minimumPayment * months - d.currentBalance);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: `slideUp 300ms ${springs.bounce}` }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Debt Tracker</h1>
        <button onClick={() => setShowAdd(true)} style={{ padding: "10px 18px", background: C.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 16px ${C.accentGlow}` }}>+ Add Debt</button>
      </div>

      <div style={{ background: C.surface, borderRadius: 20, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: C.shadow, position: "relative", overflow: "hidden", animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle, ${C.expenseSoft} 0%, transparent 70%)` }} />
        <Label C={C} style={{ marginBottom: 8 }}>Total Debt Remaining</Label>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, letterSpacing: "-2px", color: C.expense, marginBottom: 16 }}>{user.currency} {totalDebtNum.toLocaleString()}</div>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <Label C={C} style={{ marginBottom: 4 }}>Est. Total Interest</Label>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: C.warning }}>{user.currency} {Math.round(totalInterest).toLocaleString()}</div>
          </div>
          <div>
            <Label C={C} style={{ marginBottom: 4 }}>Active Debts</Label>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: C.text }}>{debts.length}</div>
          </div>
        </div>
      </div>

      {/* Payoff method */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "20px 24px", border: `1px solid ${C.border}`, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Payoff Strategy</h3>
          <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
            {[{ id: "snowball", label: "❄️ Snowball" }, { id: "avalanche", label: "🏔 Avalanche" }].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: method === m.id ? C.accent : "transparent",
                color: method === m.id ? "white" : C.textSub, fontSize: 12, fontWeight: 600,
                transition: `all 200ms ${springs.snap}`,
              }}>{m.label}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
          {method === "snowball" ? "Pay off smallest balance first for quick wins and momentum." : "Pay off highest interest rate first to minimize total interest paid."}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((d, i) => {
            const months = payoffMonths(d.currentBalance, d.interestRate, d.minimumPayment);
            const payoffDate = isFinite(months) ? new Date(Date.now() + months * 30 * 86400000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "∞";
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, fontSize: 14, color: C.text }}>{d.lender}</span>
                <span style={{ fontSize: 13, color: C.textMuted }}>{user.currency} {d.currentBalance.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: C.savings, background: C.savingsSoft, padding: "3px 8px", borderRadius: 99 }}>{payoffDate}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debt cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {debts.map((debt, i) => <DebtCard key={debt.id} debt={debt} i={i} user={user} C={C} onPayment={setMakePayment} />)}
      </div>

      {makePayment && (
        <Modal onClose={() => setMakePayment(null)} C={C} width={360}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Make Payment</h3>
            <input type="number" placeholder="Payment amount" value={payAmt} onChange={e => setPayAmt(e.target.value)}
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontSize: 16, color: C.text, outline: "none", marginBottom: 14, textAlign: "center" }} />
            <button onClick={() => {
              const amt = parseFloat(payAmt);
              if (!amt) return;
              setDebts(ds => ds.map(d => d.id === makePayment ? { ...d, currentBalance: Math.max(0, d.currentBalance - amt) } : d));
              setMakePayment(null); setPayAmt("");
            }} style={{ width: "100%", padding: "13px", background: C.income, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Record Payment</button>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} C={C} width={440}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Add Debt</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "lender", placeholder: "Lender / creditor" },
                { key: "originalAmount", placeholder: "Original amount", type: "number" },
                { key: "currentBalance", placeholder: "Current balance", type: "number" },
                { key: "interestRate", placeholder: "Interest rate (%)", type: "number" },
                { key: "minimumPayment", placeholder: "Minimum payment", type: "number" },
                { key: "dueDay", placeholder: "Due day (1-31)", type: "number" },
              ].map(f => (
                <input key={f.key} type={f.type || "text"} placeholder={f.placeholder} value={newDebt[f.key]}
                  onChange={e => setNewDebt(d => ({ ...d, [f.key]: e.target.value }))}
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              ))}
              <select value={newDebt.type} onChange={e => setNewDebt(d => ({ ...d, type: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }}>
                <option value="loan">Loan</option><option value="credit_card">Credit Card</option>
                <option value="mortgage">Mortgage</option><option value="other">Other</option>
              </select>
              <button onClick={() => {
                const d = newDebt;
                if (d.lender && d.originalAmount && d.currentBalance) {
                  setDebts(ds => [...ds, { id: `d${Date.now()}`, lender: d.lender, originalAmount: parseFloat(d.originalAmount), currentBalance: parseFloat(d.currentBalance), interestRate: parseFloat(d.interestRate) || 0, minimumPayment: parseFloat(d.minimumPayment) || 0, dueDay: parseInt(d.dueDay) || 1, type: d.type, active: true }]);
                  setShowAdd(false);
                  setNewDebt({ lender: "", originalAmount: "", currentBalance: "", interestRate: "", minimumPayment: "", dueDay: "", type: "loan" });
                }
              }} style={{ padding: "13px", background: C.accent, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${C.accentGlow}` }}>Add Debt</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NET WORTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────