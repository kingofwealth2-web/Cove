import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import { useCountUp } from "../hooks/useCountUp";
import ProgressBar from "../components/ui/ProgressBar";
import Label from "../components/ui/Label";
import Modal from "../components/ui/Modal";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

export default function BudgetScreen({ transactions, categories, setCategories, user, C, budgetMethod, onBudgetMethodChange, onUpdateTransaction, onDeleteTransaction, selectedYear, isReadOnly }) {
  const isMobile = useIsMobile();
  const [monthOffset, setMonthOffset] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "📦", color: "#6366F1", budget: "" });
  const [editingBudget, setEditingBudget] = useState({});
  const [editCat, setEditCat] = useState(null);
  const [editTx, setEditTx] = useState(null);

  const method = budgetMethod || "envelope";
  const isEnvelope = method === "envelope";

  const now = new Date();
  const currentYear = now.getFullYear();

  // Jump to Dec of selected year when year changes
  useEffect(() => {
    if (selectedYear && selectedYear !== currentYear) {
      const diff = (selectedYear - currentYear) * 12 + (11 - now.getMonth());
      setMonthOffset(diff);
    } else {
      setMonthOffset(0);
    }
  }, [selectedYear]);

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const canGoPrev = !selectedYear || viewDate.getFullYear() > selectedYear || viewDate.getMonth() > 0;
  const canGoNext = !isReadOnly || viewDate.getFullYear() < selectedYear || viewDate.getMonth() < 11;

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
          <button onClick={() => canGoPrev && setMonthOffset(m => m - 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: canGoPrev ? "pointer" : "default", color: canGoPrev ? C.text : C.textMuted, fontSize: 16, opacity: canGoPrev ? 1 : 0.3 }}>‹</button>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, letterSpacing: "-0.5px", minWidth: 180, textAlign: "center" }}>{monthName}</h1>
          <button onClick={() => canGoNext && setMonthOffset(m => m + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, cursor: canGoNext ? "pointer" : "default", color: canGoNext ? C.text : C.textMuted, fontSize: 16, opacity: canGoNext ? 1 : 0.3 }}>›</button>
        </div>
        {!isReadOnly && (
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
          {["envelope", "flexible"].map(m => (
            <button key={m} onClick={() => onBudgetMethodChange && onBudgetMethodChange(m)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: method === m ? C.surface : "transparent",
              color: method === m ? C.text : C.textMuted,
              fontSize: 12, fontWeight: 500, textTransform: "capitalize",
              boxShadow: method === m ? C.shadow : "none",
              transition: `all 200ms ${springs.snap}`,
            }}>{m}</button>
          ))}
        </div>
        )}
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
              animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${60 + i * 40}ms`,
            }}>
              <div onClick={() => setExpanded(isExpanded ? null : cat.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer",
                opacity: isEnvelope && budget === 0 ? 0.6 : 1,
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
                    {isEnvelope && budget > 0 && (cat.alertAt ?? 80) !== 80 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.warning, background: C.warning + "18", padding: "2px 8px", borderRadius: 99 }}>alert {cat.alertAt}%</span>
                    )}
                  </div>
                  {isEnvelope
                    ? <ProgressBar value={barVal} max={barMax > 0 ? barMax : 1} color={isOver ? C.expense : barColor} delay={80 + i * 40} C={C} />
                    : <ProgressBar value={spent} max={budget > 0 ? budget : (spent || 1)} color={spent > budget && budget > 0 ? C.warning : cat.color} delay={80 + i * 40} C={C} />
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
                {!isReadOnly && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: 2 }} onClick={e => e.stopPropagation()}>
                    <button disabled={i === 0} onClick={() => {
                      const cats = [...categories];
                      const expIdx = cats.indexOf(cat);
                      if (expIdx > 0) { [cats[expIdx - 1], cats[expIdx]] = [cats[expIdx], cats[expIdx - 1]]; setCategories(cats); }
                    }} style={{ width: 20, height: 18, border: "none", background: "transparent", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? C.border : C.textMuted, fontSize: 12, padding: 0, lineHeight: 1 }}>▲</button>
                    <button disabled={i === expenseCategories.length - 1} onClick={() => {
                      const cats = [...categories];
                      const expIdx = cats.indexOf(cat);
                      if (expIdx < cats.length - 1) { [cats[expIdx], cats[expIdx + 1]] = [cats[expIdx + 1], cats[expIdx]]; setCategories(cats); }
                    }} style={{ width: 20, height: 18, border: "none", background: "transparent", cursor: i === expenseCategories.length - 1 ? "default" : "pointer", color: i === expenseCategories.length - 1 ? C.border : C.textMuted, fontSize: 12, padding: 0, lineHeight: 1 }}>▼</button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px 16px" }}>

                  {/* Category actions */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditCat({ ...cat }); }} style={{ padding: "7px 14px", background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>✏️ Edit name & icon</button>
                    <button onClick={(e) => { e.stopPropagation(); setCategories(cats => cats.filter(c => c.id !== cat.id)); setExpanded(null); }} style={{ padding: "7px 14px", background: C.expenseSoft, color: C.expense, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>🗑 Delete</button>
                  </div>

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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12 }}>
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

                  {/* Alert threshold editor */}
                  {isEnvelope && (cat.budget || 0) > 0 && !isReadOnly && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12 }}>
                      <span style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>Alert me at</span>
                      <input
                        type="number" min="1" max="99"
                        value={editingBudget[`alert_${cat.id}`] ?? (cat.alertAt ?? 80)}
                        onChange={e => setEditingBudget(prev => ({ ...prev, [`alert_${cat.id}`]: e.target.value }))}
                        onBlur={() => {
                          const val = Math.min(99, Math.max(1, parseInt(editingBudget[`alert_${cat.id}`])));
                          if (!isNaN(val)) setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, alertAt: val } : c));
                          setEditingBudget(prev => { const n = { ...prev }; delete n[`alert_${cat.id}`]; return n; });
                        }}
                        onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 14, color: C.text, outline: "none", width: 70, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
                      />
                      <span style={{ fontSize: 13, color: C.textMuted }}>%</span>
                    </div>
                  )}

                  {/* Transactions */}
                  {catTx.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.textMuted, padding: "4px 0" }}>No transactions this month</div>
                  ) : catTx.map((tx, j) => (
                    <div key={tx.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: j < catTx.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.text }}>{tx.note || cat.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(tx.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.text }}>
                          -{user.currency} {tx.amount.toLocaleString()}
                          {tx.originalCurrency && tx.originalCurrency !== user.currency && (
                            <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 5 }}>({tx.originalCurrency} {tx.originalAmount?.toLocaleString()})</span>
                          )}
                        </div>
                        <button onClick={() => setEditTx({ ...tx })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.textMuted, padding: "2px 4px", borderRadius: 6 }}
                          onMouseEnter={e => e.currentTarget.style.color = C.accent}
                          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                        >✏️</button>
                        <button onClick={() => onDeleteTransaction && onDeleteTransaction(tx.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.textMuted, padding: "2px 4px", borderRadius: 6 }}
                          onMouseEnter={e => e.currentTarget.style.color = C.expense}
                          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                        >🗑</button>
                      </div>
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
          !isReadOnly && <button onClick={() => setAddingCat(true)} style={{
            padding: "18px", borderRadius: 18, border: `2px dashed ${C.border}`, background: "transparent",
            color: C.textMuted, fontSize: 14, cursor: "pointer", width: "100%",
            transition: `all 200ms ${springs.snap}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >+ Add Category</button>
        )}
      </div>

      {editCat && (
        <Modal onClose={() => setEditCat(null)} C={C} width={380}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Edit Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Category name" value={editCat.name} onChange={e => setEditCat(c => ({ ...c, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["📦","🎮","💊","🛒","📱","🎵","🏋️","🐾","✈️","🎨","🍔","🚗","🏠","💡","❤️","🎉","💰","📚"].map(em => (
                  <button key={em} onClick={() => setEditCat(c => ({ ...c, icon: em }))} style={{
                    width: 38, height: 38, borderRadius: 10, border: `2px solid ${editCat.icon === em ? C.accent : "transparent"}`,
                    background: C.surfaceAlt, cursor: "pointer", fontSize: 18,
                  }}>{em}</button>
                ))}
              </div>
              <button onClick={() => {
                if (editCat.name) {
                  setCategories(cats => cats.map(c => c.id === editCat.id ? { ...c, name: editCat.name, icon: editCat.icon } : c));
                  setEditCat(null);
                }
              }} style={{ padding: "13px", background: C.accent, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${C.accentGlow}` }}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {editTx && (
        <Modal onClose={() => setEditTx(null)} C={C} width={440}>
          <div style={{ padding: "24px 28px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Edit Transaction</h3>
            <EditTxForm tx={editTx} categories={categories} user={user} C={C}
              onSave={(id, updates) => { onUpdateTransaction && onUpdateTransaction(id, updates); setEditTx(null); }}
              onClose={() => setEditTx(null)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditTxForm({ tx, categories, user, C, onSave, onClose }) {
  const [type, setType] = useState(tx.type);
  const [amount, setAmount] = useState(String(tx.amount));
  const [catId, setCatId] = useState(tx.categoryId);
  const [note, setNote] = useState(tx.note || "");
  const [date, setDate] = useState(tx.date);
  const filteredCats = categories.filter(c => type === "income" ? c.is_income : !c.is_income);

  return (
    <>
      <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
        {["expense","income"].map(t => (
          <button key={t} onClick={() => { setType(t); setCatId(null); }} style={{
            flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
            background: type === t ? (t === "income" ? C.income : C.expense) : "transparent",
            color: type === t ? "white" : C.textSub, fontSize: 13, fontWeight: 600, textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>{user.currency}</span>
        <input autoFocus type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 28, fontFamily: "'DM Serif Display', serif", color: C.text, letterSpacing: "-1px" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {filteredCats.map(cat => (
          <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
            padding: "7px 13px", borderRadius: 99,
            border: `1px solid ${catId === cat.id ? cat.color + "60" : "transparent"}`,
            background: catId === cat.id ? cat.color + "22" : C.surfaceAlt,
            color: catId === cat.id ? cat.color : C.textSub,
            fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}><span>{cat.icon}</span>{cat.name}</button>
        ))}
      </div>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note..."
        style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", marginBottom: 12 }} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", colorScheme: "dark", marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onSave(tx.id, { type, amount: parseFloat(amount), categoryId: catId, note, date, isRecurring: tx.isRecurring })} style={{
          flex: 2, padding: "13px", borderRadius: 12, border: "none",
          background: C.accent, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
          boxShadow: `0 6px 20px ${C.accentGlow}`,
        }}>Save Changes</button>
      </div>
    </>
  );
}