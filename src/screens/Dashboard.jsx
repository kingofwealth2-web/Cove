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

function TxRow({ tx, i, isLast, categories, user, C, formatDate, onDelete, onEdit }) {
  const cat = categories.find(c => c.id === tx.categoryId);
  const [hov, setHov] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); }}
        onClick={() => setShowActions(s => !s)}
        style={{
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
      {showActions && (
        <div style={{ display: "flex", gap: 8, padding: "6px 18px 10px", animation: `slideUp 150ms ${springs.snap}` }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(tx); setShowActions(false); }} style={{
            padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surfaceAlt, color: C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>✏️ Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} style={{
            padding: "6px 16px", borderRadius: 8, border: `1px solid ${C.expense}33`,
            background: C.expenseSoft, color: C.expense, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>🗑 Delete</button>
          <button onClick={(e) => { e.stopPropagation(); setShowActions(false); }} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", marginLeft: "auto",
          }}>✕</button>
        </div>
      )}
      {!isLast && <div style={{ height: 1, background: C.border, margin: "0 18px" }} />}
    </div>
  );
}

function EditTxModal({ tx, categories, user, C, onSave, onClose }) {
  const [type, setType] = useState(tx.type);
  const [amount, setAmount] = useState(String(tx.amount));
  const [catId, setCatId] = useState(tx.categoryId);
  const [note, setNote] = useState(tx.note || "");
  const [date, setDate] = useState(tx.date);

  return (
    <Modal onClose={onClose} C={C} width={440}>
      <div style={{ padding: "24px 28px" }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Edit Transaction</h3>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
              background: type === t ? (t === "income" ? C.income : C.expense) : "transparent",
              color: type === t ? "white" : C.textSub, fontSize: 13, fontWeight: 600, textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>{user.currency}</span>
          <input autoFocus type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 28, fontFamily: "'DM Serif Display', serif", color: C.text, letterSpacing: "-1px" }} />
        </div>
        {type === "expense" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
                padding: "7px 13px", borderRadius: 99,
                border: `1px solid ${catId === cat.id ? cat.color + "60" : "transparent"}`,
                background: catId === cat.id ? cat.color + "22" : C.surfaceAlt,
                color: catId === cat.id ? cat.color : C.textSub,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}><span>{cat.icon}</span>{cat.name}</button>
            ))}
          </div>
        )}
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note..."
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", marginBottom: 12 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", colorScheme: "dark", marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave(tx.id, { type, amount: parseFloat(amount), categoryId: catId, note, date, isRecurring: tx.isRecurring }); onClose(); }} style={{
            flex: 2, padding: "13px", borderRadius: 12, border: "none",
            background: C.accent, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 6px 20px ${C.accentGlow}`,
          }}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Dashboard({ transactions, categories, user, C, onAdd, onDeleteTransaction, onUpdateTransaction }) {
  const isMobile = useIsMobile();
  const now = new Date();
  const [editTx, setEditTx] = useState(null);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", animation: `slideUp 300ms ${springs.bounce}` }}>
        <div>
          <Label C={C} style={{ marginBottom: 4 }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Label>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 24 : 30, color: C.text, letterSpacing: "-0.5px" }}>Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {user.name}</h1>
        </div>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${C.surfaceAlt} 0%, ${C.surface} 100%)`,
        borderRadius: 24, padding: isMobile ? "24px 20px" : "32px 36px",
        border: `1px solid ${C.borderStrong}`, boxShadow: C.shadowLg,
        position: "relative", overflow: "hidden",
        animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <Label C={C} style={{ marginBottom: 8 }}>Available This Month</Label>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 48 : 68, fontWeight: 700, letterSpacing: "-2px", color: safeToSpend >= 0 ? C.text : C.expense, lineHeight: 1, marginBottom: 20 }}>
          {user.currency} {safeNum.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: isMobile ? 16 : 28, flexWrap: "wrap" }}>
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

      <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>Budget</h2>
        </div>
        <div style={{ display: isMobile ? "grid" : "flex", gridTemplateColumns: isMobile ? "1fr 1fr" : undefined, gap: 12, flexWrap: "wrap" }}>
          {catSpend.map((cat, i) => <DashCatCard key={cat.id} cat={cat} i={i} user={user} C={C} />)}
        </div>
      </div>

      <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>Recent</h2>
          <span style={{ fontSize: 12, color: C.textMuted }}>Tap to edit or delete</span>
        </div>
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
          {recent.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>No transactions yet. Add your first one!</div>
          ) : (
            recent.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} i={i} isLast={i === recent.length - 1}
                categories={categories} user={user} C={C} formatDate={formatDate}
                onDelete={onDeleteTransaction} onEdit={setEditTx}
              />
            ))
          )}
        </div>
      </div>

      {editTx && (
        <EditTxModal
          tx={editTx} categories={categories} user={user} C={C}
          onSave={onUpdateTransaction} onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}
