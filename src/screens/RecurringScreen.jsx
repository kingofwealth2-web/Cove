import { useState } from "react";
import { springs } from "../tokens/springs";
import Modal from "../components/ui/Modal";

export default function RecurringScreen({ transactions, categories, user, C, onUpdateTransaction, onDeleteTransaction, selectedYear, isReadOnly }) {
  const [editTx, setEditTx] = useState(null);

  const now = new Date();
  const year = selectedYear || now.getFullYear();

  const recurring = transactions.filter(t => {
    if (!t.isRecurring) return false;
    return new Date(t.date).getFullYear() === year;
  });
  const income = recurring.filter(t => t.type === "income");
  const expenses = recurring.filter(t => t.type === "expense");

  const getCat = (id) => categories.find(c => c.id === id);

  const totalMonthlyIn = income.reduce((s, t) => s + t.amount, 0);
  const totalMonthlyOut = expenses.reduce((s, t) => s + t.amount, 0);

  const TxRow = ({ tx }) => {
    const cat = getCat(tx.categoryId);
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 0", borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: (cat?.color || C.accent) + "22",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>{cat?.icon || "🔄"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tx.note || cat?.name || "Recurring"}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{cat?.name} · Monthly</div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: tx.type === "income" ? C.income : C.expense, fontWeight: 600, marginRight: 8 }}>
          {tx.type === "income" ? "+" : "-"}{user.currency} {tx.amount.toLocaleString()}
        </div>
        {!isReadOnly && <button onClick={() => setEditTx({ ...tx })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textMuted, padding: "4px 6px", borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.color = C.accent}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
        >✏️</button>}
        {!isReadOnly && <button onClick={() => onDeleteTransaction && onDeleteTransaction(tx.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textMuted, padding: "4px 6px", borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.color = C.expense}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
        >🗑</button>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Recurring</h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: "Monthly In", value: totalMonthlyIn, color: C.income, prefix: "+" },
          { label: "Monthly Out", value: totalMonthlyOut, color: C.expense, prefix: "-" },
          { label: "Net", value: totalMonthlyIn - totalMonthlyOut, color: totalMonthlyIn - totalMonthlyOut >= 0 ? C.income : C.expense, prefix: "" },
        ].map(card => (
          <div key={card.label} style={{ background: C.surface, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: card.color, letterSpacing: "-0.5px" }}>
              {card.prefix}{user.currency} {Math.abs(card.value).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ background: C.accentSoft, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: C.accent, border: `1px solid ${C.accent}22` }}>
        🔄 These transactions are automatically logged at the start of each month. Edit or delete them here to update future auto-logs.
      </div>

      {/* Income */}
      {income.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: "20px 24px", border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Income · {income.length}</h3>
          {income.map(tx => <TxRow key={tx.id} tx={tx} />)}
        </div>
      )}

      {/* Expenses */}
      {expenses.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: "20px 24px", border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Expenses · {expenses.length}</h3>
          {expenses.map(tx => <TxRow key={tx.id} tx={tx} />)}
        </div>
      )}

      {recurring.length === 0 && (
        <div style={{ background: C.surface, borderRadius: 20, padding: "48px 24px", border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No recurring transactions</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>When adding a transaction, toggle "Recurring" to auto-log it every month.</div>
        </div>
      )}

      {editTx && (
        <Modal onClose={() => setEditTx(null)} C={C} width={440}>
          <div style={{ padding: "24px 28px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Edit Recurring</h3>
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
        style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onSave(tx.id, { type, amount: parseFloat(amount), categoryId: catId, note, date: tx.date, isRecurring: true })} style={{
          flex: 2, padding: "13px", borderRadius: 12, border: "none",
          background: C.accent, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
          boxShadow: `0 6px 20px ${C.accentGlow}`,
        }}>Save Changes</button>
      </div>
    </>
  );
}