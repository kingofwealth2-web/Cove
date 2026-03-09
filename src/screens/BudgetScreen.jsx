import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { useCountUp } from "../hooks/useCountUp";
import ProgressBar from "../components/ui/ProgressBar";
import Label from "../components/ui/Label";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}



export default function BudgetScreen({ transactions, categories, setCategories, user, C }) {
  const isMobile = useIsMobile();
  const [monthOffset, setMonthOffset] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [method, setMethod] = useState("envelope");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "📦", color: "#6366F1", budget: "" });

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });

  const totalBudgeted = categories.reduce((s, c) => s + c.budget, 0);
  const totalSpent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const budgetNum = useCountUp(totalBudgeted, 600, 100, [totalBudgeted, monthOffset]);
  const spentNum = useCountUp(totalSpent, 600, 200, [totalSpent, monthOffset]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: `slideUp 300ms ${springs.bounce}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setMonthOffset(m => m - 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: "pointer", color: C.text, fontSize: 16 }}>‹</button>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, letterSpacing: "-0.5px", minWidth: 200, textAlign: "center" }}>{monthName}</h1>
          <button onClick={() => setMonthOffset(m => m + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: "pointer", color: C.text, fontSize: 16 }}>›</button>
        </div>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
          {["envelope","flexible"].map(m => (
            <button key={m} onClick={() => setMethod(m)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: method === m ? C.surface : "transparent",
              color: method === m ? C.text : C.textMuted,
              fontSize: 12, fontWeight: 500, textTransform: "capitalize",
              boxShadow: method === m ? C.shadow : "none",
              transition: `all 200ms ${springs.snap}`,
            }}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        {[
          { label: "Total Budgeted", value: budgetNum, color: C.accent },
          { label: "Total Spent", value: spentNum, color: totalSpent > totalBudgeted ? C.expense : C.text },
        ].map(item => (
          <div key={item.label} style={{ background: C.surface, borderRadius: 20, padding: "22px 24px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            <Label C={C} style={{ marginBottom: 8 }}>{item.label}</Label>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: item.color, letterSpacing: "-1px" }}>{user.currency} {item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map((cat, i) => {
          const catTx = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id);
          const spent = catTx.reduce((s, t) => s + t.amount, 0);
          const pct = cat.budget > 0 ? (spent / cat.budget) * 100 : 0;
          const isExpanded = expanded === cat.id;
          const isOver = pct > 100;

          return (
            <div key={cat.id} style={{
              background: isOver ? C.expenseSoft : C.surface, borderRadius: 18,
              border: `1px solid ${isOver ? C.expense + "30" : C.border}`,
              boxShadow: C.shadow, overflow: "hidden",
              animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${60 + i * 40}ms`,
            }}>
              <div onClick={() => setExpanded(isExpanded ? null : cat.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{cat.name}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{cat.group}</span>
                    {cat.rollover && <span style={{ fontSize: 11, fontWeight: 600, color: C.savings, background: C.savingsSoft, padding: "2px 8px", borderRadius: 99 }}>+rollover</span>}
                    {isOver && <span style={{ fontSize: 11, fontWeight: 600, color: C.expense, background: C.expenseSoft, padding: "2px 8px", borderRadius: 99 }}>Over</span>}
                  </div>
                  <ProgressBar value={spent} max={cat.budget} color={cat.color} delay={80 + i * 40} C={C} />
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: isOver ? C.expense : C.text }}>{user.currency} {spent.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>/ {user.currency} {cat.budget.toLocaleString()}</div>
                </div>
                <span style={{ color: C.textMuted, fontSize: 14, marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 20px 16px" }}>
                  {catTx.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>No transactions this month</div>
                  ) : catTx.map((tx, j) => (
                    <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: j < catTx.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, color: C.text }}>{tx.note || cat.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(tx.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.text }}>-{user.currency} {tx.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {addingCat ? (
          <div style={{ background: C.surface, borderRadius: 18, padding: "20px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input placeholder="Category name" value={newCat.name} onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: C.text, outline: "none" }} />
              <input placeholder="Budget amount" type="number" value={newCat.budget} onChange={e => setNewCat(n => ({ ...n, budget: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: C.text, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {["📦","🎮","💊","🛒","📱","🎵","🏋️","🐾","✈️","🎨"].map(em => (
                <button key={em} onClick={() => setNewCat(n => ({ ...n, icon: em }))} style={{
                  width: 36, height: 36, borderRadius: 10, border: `2px solid ${newCat.icon === em ? C.accent : "transparent"}`,
                  background: C.surfaceAlt, cursor: "pointer", fontSize: 18,
                }}>{em}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {
                if (newCat.name && newCat.budget) {
                  setCategories(cats => [...cats, { id: `c${Date.now()}`, name: newCat.name, icon: newCat.icon, color: C.accent, budget: parseFloat(newCat.budget), group: "Custom", rollover: false }]);
                  setAddingCat(false);
                  setNewCat({ name: "", icon: "📦", color: "#6366F1", budget: "" });
                }
              }} style={{ flex: 1, padding: "11px", background: C.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Add</button>
              <button onClick={() => setAddingCat(false)} style={{ padding: "11px 20px", background: C.surfaceAlt, color: C.textSub, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingCat(true)} style={{
            padding: "18px", borderRadius: 18, border: `2px dashed ${C.border}`, background: "transparent",
            color: C.textMuted, fontSize: 14, cursor: "pointer", width: "100%",
            transition: `all 200ms ${springs.snap}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >+ Add Category</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRENDS SCREEN
// ─────────────────────────────────────────────────────────────────────────────