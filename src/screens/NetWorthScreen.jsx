import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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



export default function NetWorthScreen({ assets, setAssets, liabilities, setLiabilities, user, C, snapshots = [], saveNetworthSnapshot }) {
  const isMobile = useIsMobile();
  const [editAsset, setEditAsset] = useState(null);
  const [editLiability, setEditLiability] = useState(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiab, setShowAddLiab] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", type: "cash", value: "" });
  const [newLiab, setNewLiab] = useState({ name: "", type: "loan", balance: "" });
  const [assetsOpen, setAssetsOpen] = useState(true);
  const [liabsOpen, setLiabsOpen] = useState(true);

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabs = liabilities.reduce((s, l) => s + l.balance, 0);
  const netWorth = totalAssets - totalLiabs;

  // Save snapshot whenever net worth changes
  useEffect(() => {
    if (saveNetworthSnapshot && (assets.length > 0 || liabilities.length > 0)) {
      saveNetworthSnapshot(netWorth);
    }
  }, [netWorth]);

  // Build chart data from real snapshots
  const chartData = snapshots.map(s => ({
    month: s.month.slice(0, 7), // "2026-03"
    value: s.net_worth,
    label: new Date(s.month + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
  }));

  // If only 1 snapshot, duplicate it so the chart renders a line
  const displayData = chartData.length === 1
    ? [{ ...chartData[0], label: "Start" }, { ...chartData[0], label: chartData[0].label }]
    : chartData;

  const nwNum = useCountUp(Math.abs(netWorth), 800, 200, [netWorth]);

  const assetTypeEmoji = { cash: "💵", savings: "🏦", property: "🏠", investment: "📈", vehicle: "🚗", other: "📦" };
  const liabTypeEmoji = { loan: "📋", credit_card: "💳", mortgage: "🏠", other: "📦" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px", animation: `slideUp 300ms ${springs.bounce}` }}>Net Worth</h1>

      <div style={{ background: C.surface, borderRadius: 22, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: C.shadowLg, position: "relative", overflow: "hidden", animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: `radial-gradient(circle, ${netWorth >= 0 ? C.incomeSoft : C.expenseSoft} 0%, transparent 70%)` }} />
        <Label C={C} style={{ marginBottom: 8 }}>Total Net Worth</Label>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 60, letterSpacing: "-2px", color: netWorth >= 0 ? C.income : C.expense, lineHeight: 1, marginBottom: 16 }}>
          {netWorth < 0 ? "-" : ""}{user.currency} {nwNum.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          <div>
            <Label C={C} style={{ marginBottom: 4, color: C.income }}>Assets</Label>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: C.income }}>{user.currency} {totalAssets.toLocaleString()}</div>
          </div>
          <div>
            <Label C={C} style={{ marginBottom: 4, color: C.expense }}>Liabilities</Label>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: C.expense }}>{user.currency} {totalLiabs.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Net worth chart */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Net Worth Over Time</h3>
        {displayData.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "32px 0" }}>
            Add assets or liabilities to start tracking your net worth over time.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={netWorth >= 0 ? C.income : C.expense} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={netWorth >= 0 ? C.income : C.expense} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13 }}
                formatter={(v) => [`${user.currency} ${v.toLocaleString()}`, "Net Worth"]}
              />
              <Area type="monotone" dataKey="value" stroke={netWorth >= 0 ? C.income : C.expense} strokeWidth={2.5} fill="url(#nwGrad)" dot={displayData.length <= 6} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Assets */}
      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden", animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "120ms" }}>
        <div onClick={() => setAssetsOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📈</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Assets</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: C.income }}>{user.currency} {totalAssets.toLocaleString()}</span>
            <span style={{ color: C.textMuted }}>{assetsOpen ? "▲" : "▼"}</span>
          </div>
        </div>
        {assetsOpen && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {assets.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 20 }}>{assetTypeEmoji[a.type] || "📦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, textTransform: "capitalize" }}>{a.type}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.income }}>{user.currency} {a.value.toLocaleString()}</div>
                <button onClick={() => setEditAsset(a)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted, padding: "4px 6px" }}>✏️</button>
                <button onClick={() => setAssets(as => as.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted, padding: "4px 6px" }}>🗑</button>
              </div>
            ))}
            <button onClick={() => setShowAddAsset(true)} style={{ width: "100%", padding: "14px 22px", background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 14, fontWeight: 600, textAlign: "left" }}>+ Add Asset</button>
          </div>
        )}
      </div>

      {/* Liabilities */}
      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden", animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
        <div onClick={() => setLiabsOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📉</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Liabilities</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: C.expense }}>{user.currency} {totalLiabs.toLocaleString()}</span>
            <span style={{ color: C.textMuted }}>{liabsOpen ? "▲" : "▼"}</span>
          </div>
        </div>
        {liabsOpen && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {liabilities.map((l, i) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 20 }}>{liabTypeEmoji[l.type] || "📦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, textTransform: "capitalize" }}>{l.type.replace("_", " ")}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.expense }}>{user.currency} {l.balance.toLocaleString()}</div>
                <button onClick={() => setLiabilities(ls => ls.filter(x => x.id !== l.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted, padding: "4px 6px" }}>🗑</button>
              </div>
            ))}
            <button onClick={() => setShowAddLiab(true)} style={{ width: "100%", padding: "14px 22px", background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 14, fontWeight: 600, textAlign: "left" }}>+ Add Liability</button>
          </div>
        )}
      </div>

      {showAddAsset && (
        <Modal onClose={() => setShowAddAsset(false)} C={C} width={380}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Add Asset</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Asset name" value={newAsset.name} onChange={e => setNewAsset(a => ({ ...a, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <select value={newAsset.type} onChange={e => setNewAsset(a => ({ ...a, type: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }}>
                {["cash","savings","property","investment","vehicle","other"].map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}
              </select>
              <input type="number" placeholder="Value" value={newAsset.value} onChange={e => setNewAsset(a => ({ ...a, value: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <button onClick={() => {
                if (newAsset.name && newAsset.value) {
                  setAssets(as => [...as, { id: `a${Date.now()}`, name: newAsset.name, type: newAsset.type, value: parseFloat(newAsset.value) }]);
                  setShowAddAsset(false); setNewAsset({ name: "", type: "cash", value: "" });
                }
              }} style={{ padding: "13px", background: C.income, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Add Asset</button>
            </div>
          </div>
        </Modal>
      )}
      {showAddLiab && (
        <Modal onClose={() => setShowAddLiab(false)} C={C} width={380}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Add Liability</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Name" value={newLiab.name} onChange={e => setNewLiab(l => ({ ...l, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <select value={newLiab.type} onChange={e => setNewLiab(l => ({ ...l, type: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }}>
                {["loan","credit_card","mortgage","other"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
              <input type="number" placeholder="Balance" value={newLiab.balance} onChange={e => setNewLiab(l => ({ ...l, balance: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <button onClick={() => {
                if (newLiab.name && newLiab.balance) {
                  setLiabilities(ls => [...ls, { id: `l${Date.now()}`, name: newLiab.name, type: newLiab.type, balance: parseFloat(newLiab.balance) }]);
                  setShowAddLiab(false); setNewLiab({ name: "", type: "loan", balance: "" });
                }
              }} style={{ padding: "13px", background: C.expense, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>Add Liability</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SCREEN
// ─────────────────────────────────────────────────────────────────────────────