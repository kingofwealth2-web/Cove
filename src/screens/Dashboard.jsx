import { useState } from "react";
import { springs } from "../tokens/springs";
import { useCountUp } from "../hooks/useCountUp";
import ProgressBar from "../components/ui/ProgressBar";
import Label from "../components/ui/Label";


function DashCatCard({ cat, i, user, C }) {
  const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: "1 1 150px", background: pct > 100 ? C.expenseSoft : C.surface,
        borderRadius: 20, padding: "18px 20px",
        border: `1px solid ${pct > 100 ? C.expense + "40" : hov ? C.borderStrong : C.border}`,
        boxShadow: hov ? C.shadowLg : C.shadow,
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: `all 200ms ${springs.snap}`, cursor: "pointer",
        animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${100 + i * 50}ms`,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: pct > 100 ? C.expense : pct > 80 ? C.warning : C.textMuted, background: pct > 100 ? C.expenseSoft : C.surfaceAlt, padding: "3px 8px", borderRadius: 99 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{cat.name}</div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
        {pct > 100 ? "Over budget" : `${user.currency} ${(cat.budget - cat.spent).toLocaleString()} left`}
      </div>
      <ProgressBar value={cat.spent} max={cat.budget} color={cat.color} delay={120 + i * 50} C={C} />
    </div>
  );
}

function TxRow({ tx, i, isLast, categories, user, C, formatDate }) {
  const cat = categories.find(c => c.id === tx.categoryId);
  const [hov, setHov] = useState(false);
  return (
    <div>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
        background: hov ? C.surfaceHover : "transparent",
        transition: `background 150ms`, cursor: "pointer",
        animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${180 + i * 35}ms`,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat?.color || C.income) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
          {tx.type === "income" ? "💰" : cat?.icon || "💸"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || (tx.type === "income" ? "Income" : cat?.name)}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{cat?.name || "Income"} · {formatDate(tx.date)}</div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: tx.type === "income" ? C.income : C.text, flexShrink: 0 }}>
          {tx.type === "income" ? "+" : "-"}{user.currency} {tx.amount.toLocaleString()}
        </div>
      </div>
      {!isLast && <div style={{ height: 1, background: C.border, margin: "0 18px" }} />}
    </div>
  );
}

export default function Dashboard({ transactions, categories, user, C, onAdd }) {
  const now = new Date();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalIncome = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalSpent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const safeToSpend = totalIncome - totalSpent;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPct = (dayOfMonth / daysInMonth) * 100;
  const spendPct = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

  const safeNum = useCountUp(Math.max(safeToSpend, 0), 800, 200, [safeToSpend]);
  const incNum = useCountUp(totalIncome, 600, 300, [totalIncome]);
  const spentNum = useCountUp(totalSpent, 600, 400, [totalSpent]);

  const catSpend = categories.map(cat => {
    const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
    return { ...cat, spent };
  });

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const [deleteId, setDeleteId] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", animation: `slideUp 300ms ${springs.bounce}` }}>
        <div>
          <Label C={C} style={{ marginBottom: 4 }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Label>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {user.name}</h1>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surfaceAlt} 0%, ${C.surface} 100%)`,
        borderRadius: 24, padding: "32px 36px",
        border: `1px solid ${C.borderStrong}`, boxShadow: C.shadowLg,
        position: "relative", overflow: "hidden",
        animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <Label C={C} style={{ marginBottom: 8 }}>Available This Month</Label>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 68, fontWeight: 700, letterSpacing: "-2px", color: safeToSpend >= 0 ? C.text : C.expense, lineHeight: 1, marginBottom: 20 }}>
          {user.currency} {safeNum.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: C.incomeSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↑</div>
            <span style={{ fontSize: 14, color: C.textSub }}><span style={{ color: C.income, fontWeight: 600 }}>{user.currency} {incNum.toLocaleString()}</span> income</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: C.expenseSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↓</div>
            <span style={{ fontSize: 14, color: C.textSub }}><span style={{ color: C.expense, fontWeight: 600 }}>{user.currency} {spentNum.toLocaleString()}</span> spent</span>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Day {dayOfMonth} of {daysInMonth}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: spendPct > monthPct + 10 ? C.warning : C.textMuted }}>
              {spendPct > monthPct + 10 ? "⚠ Spending ahead of pace" : "✓ On track"}
            </span>
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 99, background: C.surfaceHover }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 99, overflow: "hidden" }}>
              <ProgressBar value={monthPct} max={100} color={C.textMuted} delay={200} height={6} C={C} />
            </div>
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 99, marginTop: -6 }}>
            <ProgressBar value={spendPct} max={100} color={spendPct > monthPct + 10 ? C.warning : C.accent} delay={400} height={6} C={C} />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>Budget</h2>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {catSpend.map((cat, i) => <DashCatCard key={cat.id} cat={cat} i={i} user={user} C={C} />)}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>Recent</h2>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
          {recent.map((tx, i) => <TxRow key={tx.id} tx={tx} i={i} isLast={i === recent.length - 1} categories={categories} user={user} C={C} formatDate={formatDate} />)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET SCREEN
// ─────────────────────────────────────────────────────────────────────────────