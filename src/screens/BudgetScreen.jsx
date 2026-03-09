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
  const [editingBudget, setEditingBudget] = useState({});

  const isEnvelope = method === "envelope";

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });

  const expenseCategories = categories.filter(c => !c.is_income);
  const totalBudgeted = expenseCategories.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const budgetNum = useCountUp(isEnvelope ? totalBudgeted : totalSpent, 600, 100, [totalBudgeted, totalSpent, monthOffset, method]);
  const secondNum = useCountUp(isEnvelope ? totalRemaining : totalBudgeted, 600, 200, [totalBudgeted, totalSpent, monthOffset, method]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, animation: `slideUp 300ms ${springs.bounce}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setMonthOffset(m => m - 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: "pointer", color: C.text, fontSize: 16 }}>‹</button>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, letterSpacing: "-0.5px", minWidth: 180, textAlign: "center" }}>{monthName}</h1>
          <button onClick={() => setMonthOffset(m => m + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: "pointer", color: C.text, fontSize: 16 }}>›</button>
        </div>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
          {["envelope", "flexible"].map(m => (
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

      {/* Mode description banner */}
      <div style={{
        padding: "12px 18px", borderRadius: 14,
        background: isEnvelope ? C.accentSoft : C.savingsSoft,
        border: `1px solid ${isEnvelope ? C.accent + "30" : C.savings + "30"}`,
        fontSize: 13, color: isEnvelope ? C.accent : C.savings,
        animation: `slideUp 250ms ${springs.bounce}`,
      }}>
        {isEnvelope
          ? "📬 Envelope — fixed allocations per category. Spending stops at your limit."
          : "🌊 Flexible — no hard limits. Track patterns and see where money flows."}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        <div style={{ background: C.surface, borderRadius: 20, padding: "22px 24px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
          <Label C={C} style={{ marginBottom: 8 }}>{isEnvelope ? "Total Budgeted" : "Total Spent"}</Label>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.accent, letterSpacing: "-1px" }}>{user.currency} {budgetNum.toLocaleString()}</div>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, padding: "22px 24px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
          <Label C={C} style={{ marginBottom: 8 }}>{isEnvelope ? "Remaining" : "Budgeted"}</Label>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, letterSpacing: "-1px", color: isEnvelope ? (totalRemaining < 0 ? C.expense : C.income) : C.textMuted }}>
            {isEnvelope && totalRemaining < 0 ? "-" : ""}{user.currency} {Math.abs(secondNum).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Category rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {expenseCategories.map((cat, i) => {
          const catTx = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id);
          const spent = catTx.reduce((s, t) => s + t.amount, 0);
          const budget = cat.budget || 0;
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          const isExpanded = expanded === cat.id;
          const isOver = isEnvelope && budget > 0 && pct > 100;
          const remaining = budget - spent;

          // Flexible: colour by spend density (no red warning)
          const flexColor = spent === 0 ? C.textMuted : cat.color;
          const barColor = isEnvelope ? cat.color : flexColor;
          const barMax = isEnvelope ? (budget || spent || 1) : (spent || 1);
          const barVal = isEnvelope ? spent : spent;

          return (
            <div key={cat.id} style={{
              background: isOver ? C.expenseSoft : C.surface,
              borderRadius: 18,
              border: `1px solid ${isOver ? C.expense + "40" : C.border}`,
              boxShadow: C.shadow, overflow: "hidden",
              opacity: isEnvelope && budget === 0 ? 0.6 : 1,
              animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${60 + i * 40}ms`,
            }}>
              <div onClick={() => setExpanded(isExpanded ? null : cat.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{cat.name}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{cat.group}</span>
                    {cat.rollover && <span style={{ fontSize: 11, fontWeight: 600, color: C.savings, background: C.savingsSoft, padding: "2px 8px", borderRadius: 99 }}>+rollover</span>}
                    {isEnvelope && isOver && <span style={{ fontSize: 11, fontWeight: 600, color: C.expense, background: C.expenseSoft, padding: "2px 8px", borderRadius: 99 }}>Over</span>}
                    {isEnvelope && budget === 0 && <span style={{ fontSize: 11, color: C.textMuted, background: C.surfaceAlt, padding: "2px 8px", borderRadius: 99 }}>No limit set</span>}
                    {!isEnvelope && spent === 0 && <span style={{ fontSize: 11, color: C.textMuted, background: C.surfaceAlt, padding: "2px 8px", borderRadius: 99 }}>No spend</span>}
                  </div>
                  {isEnvelope
                    ? <ProgressBar value={barVal} max={barMax > 0 ? barMax : 1} color={isOver ? C.expense : barColor} delay={80 + i * 40} C={C} />
                    : (
                      /* Flexible: just a solid fill bar, no max cap */
                      <div style={{ height: 5, borderRadius: 99, background: C.border, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: spent > 0 ? "100%" : "0%", background: cat.color, borderRadius: 99, opacity: 0.7 }} />
                      </div>
                    )
                  }
                </div>

                {/* Right side numbers */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {isEnvelope ? (
                    <>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: isOver ? C.expense : C.text }}>{user.currency} {spent.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>/ {user.currency} {budget.toLocaleString()}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: spent > 0 ? cat.color : C.textMuted }}>{user.currency} {spent.toLocaleString()}</div>
                      {budget > 0 && <div style={{ fontSize: 12, color: C.textMuted }}>ref {user.currency} {budget.toLocaleString()}</div>}
                    </>
                  )}
                </div>
                <span style={{ color: C.textMuted, fontSize: 14, marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px 16px" }}>

                  {/* Envelope: show remaining callout */}
                  {isEnvelope && budget > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 12, marginBottom: 12,
                      background: isOver ? C.expenseSoft : C.incomeSoft,
                      border: `1px solid ${isOver ? C.expense + "30" : C.income + "30"}`,
                    }}>
                      <span style={{ fontSize: 13, color: isOver ? C.expense : C.income, fontWeight: 600 }}>
                        {isOver ? `⚠ Over by ${user.currency} ${Math.abs(remaining).toLocaleString()}` : `✓ ${user.currency} ${remaining.toLocaleString()} remaining`}
                      </span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{Math.round(pct)}% used</span>
                    </div>
                  )}

                  {/* Flexible: show spend insight */}
                  {!isEnvelope && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 12, marginBottom: 12,
                      background: C.surfaceAlt,
                    }}>
                      <span style={{ fontSize: 13, color: C.textMuted }}>
                        {catTx.length} transaction{catTx.length !== 1 ? "s" : ""} · avg {user.currency} {catTx.length > 0 ? Math.round(spent / catTx.length).toLocaleString() : 0}
                      </span>
                      {budget > 0 && (
                        <span style={{ fontSize: 12, color: pct > 100 ? C.warning : C.textMuted }}>
                          {Math.round(pct)}% of reference
                        </span>
                      )}
                    </div>
                  )}

                  {/* Budget editor */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12 }}>
                    <span style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>{isEnvelope ? "Monthly limit" : "Reference budget"}</span>
                    <span style={{ fontSize: 13, color: C.textMuted }}>{user.currency}</span>
                    <input
                      type="number"
                      value={editingBudget[cat.id] ?? (cat.budget ?? 0)}
                      onChange={e => setEditingBudget(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onBlur={() => {
                        const val = parseFloat(editingBudget[cat.id]);
                        if (!isNaN(val)) setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, budget: val } : c));
                        setEditingBudget(prev => { const n = { ...prev }; delete n[cat.id]; return n; });
                      }}
                      onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                      style={{ background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "6px 10px", fontSize: 14, color: C.text, outline: "none", width: 120, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
                    />
                  </div>

                  {/* Transactions */}
                  {catTx.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.textMuted, padding: "4px 0" }}>No transactions this month</div>
                  ) : catTx.map((tx, j) => (
                    <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: j < catTx.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, color: C.text }}>{tx.note || cat.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(tx.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.text }}>-{user.currency} {tx.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add category */}
        {addingCat ? (
          <div style={{ background: C.surface, borderRadius: 18, padding: "20px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input placeholder="Category name" value={newCat.name} onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: C.text, outline: "none" }} />
              <input placeholder={isEnvelope ? "Monthly limit" : "Reference amount"} type="number" value={newCat.budget} onChange={e => setNewCat(n => ({ ...n, budget: e.target.value }))}
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
                if (newCat.name) {
                  setCategories(cats => [...cats, { id: `c${Date.now()}`, name: newCat.name, icon: newCat.icon, color: C.accent, budget: parseFloat(newCat.budget) || 0, group: "Custom", rollover: false, is_income: false }]);
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