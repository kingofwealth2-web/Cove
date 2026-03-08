import { useState } from "react";
import { springs } from "../tokens/springs";
import Modal from "../components/ui/Modal";
import Label from "../components/ui/Label";


export default function BillsScreen({ bills, setBills, user, C }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newBill, setNewBill] = useState({ name: "", amount: "", dueDay: "", isSubscription: false });

  const billsOnDay = day => bills.filter(b => b.dueDay === day);
  const totalSubs = bills.filter(b => b.isSubscription).reduce((s, b) => s + b.amount, 0);
  const totalBills = bills.reduce((s, b) => s + b.amount, 0);

  const togglePaid = (id) => setBills(bs => bs.map(b => b.id === id ? { ...b, paid: !b.paid } : b));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px", animation: `slideUp 300ms ${springs.bounce}` }}>Bills & Subscriptions</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        <div style={{ background: C.surface, borderRadius: 20, padding: "22px 24px", border: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 8 }}>Monthly Bills</Label>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: C.text }}>{user.currency} {totalBills.toLocaleString()}</div>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, padding: "22px 24px", border: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 8 }}>Subscriptions</Label>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: C.savings }}>{user.currency} {totalSubs.toLocaleString()}</div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.textMuted, paddingBottom: 4 }}>{d}</div>
          ))}
          {Array.from({ length: (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
          {calDays.map(day => {
            const dayBills = billsOnDay(day);
            const isToday = day === now.getDate();
            const hasBills = dayBills.length > 0;
            return (
              <button key={day} onClick={() => setSelectedDay(hasBills ? (selectedDay === day ? null : day) : null)} style={{
                padding: "8px 4px", borderRadius: 10, border: "none", cursor: hasBills ? "pointer" : "default",
                background: isToday ? C.accent : selectedDay === day ? C.accentSoft : "transparent",
                color: isToday ? "white" : C.text, fontSize: 13, fontWeight: isToday ? 700 : 400,
                position: "relative", transition: `all 150ms`,
              }}>
                {day}
                {hasBills && <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                  {dayBills.slice(0, 3).map((b, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: b.paid ? C.income : C.warning }} />)}
                </div>}
              </button>
            );
          })}
        </div>
        {selectedDay && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Bills on the {selectedDay}th</div>
            {billsOnDay(selectedDay).map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 14, color: C.text }}>{b.name}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.text }}>{user.currency} {b.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bills list */}
      <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "120ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>All Bills</h3>
          <button onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", background: C.accentSoft, color: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Bill</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bills.map((bill, i) => {
            const overdue = bill.dueDay < now.getDate() && !bill.paid;
            return (
              <div key={bill.id} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                background: C.surface, borderRadius: 16,
                border: `1px solid ${overdue ? C.expense + "40" : C.border}`,
                opacity: bill.paid ? 0.6 : 1,
                animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${140 + i * 35}ms`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bill.isSubscription ? C.savingsSoft : C.warningSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {bill.isSubscription ? "📺" : "📋"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{bill.name}</div>
                  <div style={{ fontSize: 12, color: overdue ? C.expense : C.textMuted }}>
                    {bill.paid ? "✓ Paid" : overdue ? "⚠ Overdue" : `Due on the ${bill.dueDay}th`}
                    {bill.isSubscription && " · Subscription"}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: C.text }}>{user.currency} {bill.amount}</div>
                <button onClick={() => togglePaid(bill.id)} style={{
                  width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${bill.paid ? C.income : C.border}`,
                  background: bill.paid ? C.incomeSoft : "transparent", cursor: "pointer", fontSize: 16, color: bill.paid ? C.income : C.textMuted,
                  transition: `all 200ms ${springs.snap}`,
                }}>{bill.paid ? "✓" : ""}</button>
              </div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} C={C} width={400}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Add Bill</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "name", placeholder: "Bill name" },
                { key: "amount", placeholder: "Amount", type: "number" },
                { key: "dueDay", placeholder: "Due day (1-31)", type: "number" },
              ].map(f => (
                <input key={f.key} type={f.type || "text"} placeholder={f.placeholder} value={newBill[f.key]}
                  onChange={e => setNewBill(b => ({ ...b, [f.key]: e.target.value }))}
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              ))}
              <button onClick={() => setNewBill(b => ({ ...b, isSubscription: !b.isSubscription }))} style={{
                display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: C.textSub, fontSize: 14, padding: 0,
              }}>
                <div style={{ width: 40, height: 24, borderRadius: 99, background: newBill.isSubscription ? C.accent : C.surfaceAlt, position: "relative", border: `1px solid ${C.border}` }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: newBill.isSubscription ? 18 : 2, transition: `left 200ms ${springs.bounce}` }} />
                </div>
                Subscription
              </button>
              <button onClick={() => {
                if (newBill.name && newBill.amount && newBill.dueDay) {
                  setBills(bs => [...bs, { id: `b${Date.now()}`, name: newBill.name, amount: parseFloat(newBill.amount), dueDay: parseInt(newBill.dueDay), isSubscription: newBill.isSubscription, paid: false, categoryId: null }]);
                  setShowAdd(false);
                  setNewBill({ name: "", amount: "", dueDay: "", isSubscription: false });
                }
              }} style={{ padding: "13px", background: C.accent, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${C.accentGlow}` }}>Add Bill</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOALS SCREEN
// ─────────────────────────────────────────────────────────────────────────────