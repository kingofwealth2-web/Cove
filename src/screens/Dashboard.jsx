import { useState, useEffect, useMemo } from "react";
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

function TxRow({ tx, i, isLast, categories, user, C, formatDate, onDelete, onEdit, selectMode, selected, onToggleSelect }) {
  const cat = categories.find(c => c.id === tx.categoryId);
  const [hov, setHov] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => selectMode ? onToggleSelect(tx.id) : setShowActions(s => !s)}
        style={{
          display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
          background: selected ? C.accentSoft : hov ? C.surfaceHover : "transparent",
          transition: `background 150ms`, cursor: "pointer",
          animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${180 + i * 35}ms`,
        }}>
        {selectMode && (
          <div style={{
            width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? C.accent : C.border}`,
            background: selected ? C.accent : "transparent", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {selected && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
        )}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat?.color || C.income) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
          {tx.type === "income" ? "💰" : cat?.icon || "💸"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || (tx.type === "income" ? "Income" : cat?.name)}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{cat?.name || "Income"} · {formatDate(tx.date)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tx.isRecurring && <span style={{ fontSize: 10, color: C.accent, background: C.accentSoft, padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>🔄</span>}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: tx.type === "income" ? C.income : C.text, flexShrink: 0 }}>
              {tx.type === "income" ? "+" : "-"}{user.currency} {tx.amount.toLocaleString()}
            </div>
            {tx.originalCurrency && tx.originalCurrency !== user.currency && (
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'DM Mono', monospace" }}>
                {tx.originalCurrency} {tx.originalAmount?.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
      {!selectMode && showActions && (
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
  const filteredCats = categories.filter(c => type === "income" ? c.is_income : !c.is_income);
  return (
    <Modal onClose={onClose} C={C} width={440}>
      <div style={{ padding: "24px 28px" }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Edit Transaction</h3>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => { setType(t); setCatId(null); }} style={{
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {filteredCats.map(cat => (
            <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
              padding: "7px 13px", borderRadius: 99,
              border: `1px solid ${catId === cat.id ? cat.color + "60" : "transparent"}`,
              background: catId === cat.id ? cat.color + "22" : C.surfaceAlt,
              color: catId === cat.id ? cat.color : C.textSub,
              fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}><span>{cat.icon}</span>{cat.name}</button>
          ))}
        </div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note..."
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", marginBottom: 10 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", marginBottom: 20, colorScheme: "dark" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (!amount || !catId) return; onSave(tx.id, { type, amount: parseFloat(amount), categoryId: catId, note, date, isRecurring: tx.isRecurring }); onClose(); }} style={{
            flex: 2, padding: "13px", borderRadius: 12, border: "none",
            background: C.accent, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 6px 20px ${C.accentGlow}`,
          }}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Safe-to-spend explanation popover ───────────────────────────────────────
function SafeToSpendInfo({ totalIncome, totalSpent, safeToSpend, currency, C, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, marginTop: 12, zIndex: 10,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)",
      borderRadius: 18, padding: "20px 24px",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      animation: `slideUp 200ms ${springs.bounce}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 14, letterSpacing: "0.02em" }}>
        How is this calculated?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          <span>Total income logged this month</span>
          <span style={{ fontFamily: "'DM Mono', monospace", color: "#34C759" }}>+ {currency} {totalIncome.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          <span>Total expenses logged this month</span>
          <span style={{ fontFamily: "'DM Mono', monospace", color: "#FF375F" }}>− {currency} {totalSpent.toLocaleString()}</span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "white" }}>
          <span>Safe to spend</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>{currency} {safeToSpend.toLocaleString()}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
        This updates as you log transactions. It only counts what you've actually recorded — not estimates or salary fields.
      </div>
      <button onClick={onClose} style={{
        marginTop: 12, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10,
        color: "rgba(255,255,255,0.7)", fontSize: 12, padding: "7px 14px", cursor: "pointer", width: "100%",
      }}>Got it</button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Dashboard({ transactions, categories, user, C, onAdd, onDeleteTransaction, onUpdateTransaction, onBulkDeleteTransactions, selectedYear }) {
  const isMobile = useIsMobile();
  const now = new Date();
  const [editTx, setEditTx] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | income | expense
  const [filterCat, setFilterCat] = useState("all");
  const [showSearch, setShowSearch] = useState(false);

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

  const catSpend = categories.filter(c => !c.is_income).map(cat => {
    const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
    return { ...cat, spent };
  });

  // All transactions sorted, then filtered for search
  const allSorted = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  );

  const filtered = useMemo(() => {
    let txs = allSorted;
    if (filterType !== "all") txs = txs.filter(t => t.type === filterType);
    if (filterCat !== "all") txs = txs.filter(t => t.categoryId === filterCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return (
          t.note?.toLowerCase().includes(q) ||
          cat?.name.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
        );
      });
    }
    return txs;
  }, [allSorted, filterType, filterCat, searchQuery, categories]);

  const showingSearch = showSearch || searchQuery || filterType !== "all" || filterCat !== "all";
  const displayTx = showingSearch ? filtered : allSorted.slice(0, 8);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const noTransactions = transactions.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", animation: `slideUp 300ms ${springs.bounce}` }}>
        <div>
          <Label C={C} style={{ marginBottom: 4 }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Label>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 24 : 30, color: C.text, letterSpacing: "-0.5px" }}>
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {user.name}
          </h1>
        </div>
      </div>

      {/* Hero card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark || C.accent} 100%)`,
        borderRadius: 24, padding: isMobile ? "28px 24px" : "36px 40px",
        boxShadow: `0 20px 60px ${C.accentGlow}, 0 8px 24px rgba(0,0,0,0.4)`,
        position: "relative", overflow: "visible",
        animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none", overflow: "hidden" }} />
        <div style={{ position: "absolute", bottom: -80, right: 60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        {/* Label + info button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
            Safe to Spend
          </div>
          <button onClick={() => setShowInfo(s => !s)} style={{
            background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)",
          }}>?</button>
        </div>

        {/* Big number */}
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 52 : 72, fontWeight: 700, letterSpacing: "-2px", color: "white", lineHeight: 1, marginBottom: 28 }}>
          {user.currency} {safeNum.toLocaleString()}
        </div>

        {/* Info popover */}
        {showInfo && (
          <SafeToSpendInfo
            totalIncome={totalIncome} totalSpent={totalSpent} safeToSpend={safeToSpend}
            currency={user.currency} C={C} onClose={() => setShowInfo(false)}
          />
        )}

        {/* Income / Spent split */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total In</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 22 : 26, color: "white", fontWeight: 700, letterSpacing: "-0.5px" }}>{user.currency} {incNum.toLocaleString()}</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)", margin: "0 24px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Out</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 22 : 26, color: "white", fontWeight: 700, letterSpacing: "-0.5px" }}>{user.currency} {spentNum.toLocaleString()}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Day {dayOfMonth} of {daysInMonth}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: spendPct > monthPct + 10 ? "#FFD60A" : "rgba(255,255,255,0.8)" }}>
              {spendPct > monthPct + 10 ? "⚠ Spending ahead of pace" : "✓ On track"}
            </span>
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.15)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${Math.min(monthPct, 100)}%`, borderRadius: 99, background: "rgba(255,255,255,0.25)", transition: "width 600ms ease" }} />
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${Math.min(spendPct, 100)}%`, borderRadius: 99, background: spendPct > monthPct + 10 ? "#FFD60A" : "white", transition: "width 800ms ease", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {noTransactions ? (
        <div style={{ background: C.surface, borderRadius: 24, padding: "48px 32px", border: `1px solid ${C.border}`, textAlign: "center", animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 10 }}>Welcome to Cove</h2>
          <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 24, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 24px" }}>
            Add your first transaction to start tracking your money. Your safe-to-spend balance will update automatically.
          </p>
          <button onClick={onAdd} style={{
            padding: "14px 28px", background: C.accent, color: "white", border: "none",
            borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 700,
            boxShadow: `0 8px 24px ${C.accentGlow}`,
          }}>+ Add First Transaction</button>
        </div>
      ) : (
        <>
          {/* Budget overview */}
          <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>This Month</h2>
            </div>
            <div style={{ display: isMobile ? "grid" : "flex", gridTemplateColumns: isMobile ? "1fr 1fr" : undefined, gap: 12, flexWrap: "wrap" }}>
              {catSpend.filter(c => c.budget > 0 || c.spent > 0).map((cat, i) => <DashCatCard key={cat.id} cat={cat} i={i} user={user} C={C} />)}
            </div>
          </div>

          {/* Transactions with search + bulk delete */}
          <div style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>Transactions</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {selectMode ? (
                  <>
                    {selectedIds.size > 0 && (
                      <button onClick={async () => {
                        await onBulkDeleteTransactions([...selectedIds]);
                        setSelectedIds(new Set());
                        setSelectMode(false);
                      }} style={{
                        padding: "7px 14px", borderRadius: 10, border: "none",
                        background: C.expense, color: "white",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}>🗑 Delete {selectedIds.size}</button>
                    )}
                    <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} style={{
                      padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                      background: C.surfaceAlt, color: C.textSub,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setShowSearch(s => !s); if (showSearch) { setSearchQuery(""); setFilterType("all"); setFilterCat("all"); }}} style={{
                      background: showingSearch ? C.accentSoft : C.surfaceAlt,
                      color: showingSearch ? C.accent : C.textSub,
                      border: "none", borderRadius: 10, padding: "7px 14px",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: `all 200ms ${springs.snap}`,
                    }}>🔍 {showingSearch ? "Clear" : "Search"}</button>
                    <button onClick={() => setSelectMode(true)} style={{
                      background: C.surfaceAlt, color: C.textSub,
                      border: "none", borderRadius: 10, padding: "7px 14px",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>Select</button>
                  </>
                )}
              </div>
            </div>

            {/* Search / filter bar */}
            {showingSearch && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, animation: `slideUp 200ms ${springs.snap}` }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, category, amount..."
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                    padding: "12px 16px", fontSize: 14, color: C.text, outline: "none", width: "100%",
                  }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* Type filter */}
                  {["all", "income", "expense"].map(t => (
                    <button key={t} onClick={() => setFilterType(t)} style={{
                      padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: filterType === t ? C.accent : C.surfaceAlt,
                      color: filterType === t ? "white" : C.textSub,
                      transition: `all 150ms ${springs.snap}`,
                    }}>{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                  <div style={{ width: 1, background: C.border, margin: "0 4px" }} />
                  {/* Category filter */}
                  {[{ id: "all", name: "All cats", icon: "📋" }, ...categories].map(cat => (
                    <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{
                      padding: "6px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 4,
                      background: filterCat === cat.id ? (cat.color || C.accent) + "33" : C.surfaceAlt,
                      color: filterCat === cat.id ? (cat.color || C.accent) : C.textSub,
                      transition: `all 150ms ${springs.snap}`,
                    }}>
                      {cat.id !== "all" && <span>{cat.icon}</span>}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
              {displayTx.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
                  {showingSearch ? "No transactions match your search." : "No transactions yet. Add your first one!"}
                </div>
              ) : (
                <>
                  {displayTx.map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} i={i} isLast={i === displayTx.length - 1}
                      categories={categories} user={user} C={C} formatDate={formatDate}
                      onDelete={onDeleteTransaction} onEdit={setEditTx}
                      selectMode={selectMode}
                      selected={selectedIds.has(tx.id)}
                      onToggleSelect={(id) => setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                      })}
                    />
                  ))}
                  {!showingSearch && allSorted.length > 8 && (
                    <button onClick={() => setShowSearch(true)} style={{
                      width: "100%", padding: "14px", background: "none", border: "none",
                      borderTop: `1px solid ${C.border}`, color: C.accent,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>View all {allSorted.length} transactions →</button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {editTx && (
        <EditTxModal tx={editTx} categories={categories} user={user} C={C}
          onSave={onUpdateTransaction} onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}