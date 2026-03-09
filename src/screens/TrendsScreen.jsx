import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { springs } from "../tokens/springs";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

export default function TrendsScreen({ transactions, categories, user, C }) {
  const isMobile = useIsMobile();
  const [activeSlice, setActiveSlice] = useState(null);

  // Build last 6 months of real data
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });

  const barData = months.map(m => {
    const txs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    return {
      month: m.label,
      income: txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Current month spending by category (donut)
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
  });
  const donutData = categories.map(cat => ({
    name: cat.name, color: cat.color,
    value: thisMonth.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(d => d.value > 0).slice(0, 6);

  // Category sparklines — per-month spending
  const catSparkData = categories.slice(0, 5).map(cat => {
    const data = months.map(m => {
      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === "expense" && t.categoryId === cat.id;
      });
      return { v: txs.reduce((s, t) => s + t.amount, 0) };
    });
    const first = data.find(d => d.v > 0)?.v || 0;
    const last = [...data].reverse().find(d => d.v > 0)?.v || 0;
    const trend = first > 0 ? ((last - first) / first) * 100 : 0;
    return { ...cat, data, trend };
  });

  // Real insights from data
  const currentBarData = barData[barData.length - 1];
  const prevBarData = barData[barData.length - 2];
  const topCat = donutData.sort((a, b) => b.value - a.value)[0];
  const totalTx = transactions.length;
  const savingsRate = currentBarData?.income > 0
    ? Math.round(((currentBarData.income - currentBarData.expenses) / currentBarData.income) * 100)
    : 0;
  const expenseChange = prevBarData?.expenses > 0
    ? Math.round(((currentBarData?.expenses - prevBarData.expenses) / prevBarData.expenses) * 100)
    : null;

  const insights = [
    topCat && { icon: "💸", text: `Biggest expense this month: ${topCat.name} (${user.currency} ${topCat.value.toLocaleString()})` },
    expenseChange !== null && { icon: expenseChange > 0 ? "📈" : "📉", text: `Spending is ${Math.abs(expenseChange)}% ${expenseChange > 0 ? "higher" : "lower"} than last month` },
    savingsRate > 0 && { icon: "💰", text: `You're saving ${savingsRate}% of your income this month` },
    totalTx > 0 && { icon: "🔥", text: `You've logged ${totalTx} transaction${totalTx !== 1 ? "s" : ""} total` },
    savingsRate >= 20 && { icon: "🏆", text: "Excellent! You're hitting the 20% savings target" },
  ].filter(Boolean).slice(0, 5);

  const empty = transactions.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px", animation: `slideUp 300ms ${springs.bounce}` }}>Trends</h1>

      {empty ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: "48px 24px", border: `1px solid ${C.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No data yet</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Add some transactions to see your trends.</div>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Income vs Expenses — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <BarChart data={barData} barGap={4} barCategoryGap="30%">
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 12 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13 }} cursor={{ fill: C.surfaceHover }} formatter={(v) => `${user.currency} ${v.toLocaleString()}`} />
                <Bar dataKey="income" name="Income" fill={C.income} radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={C.expense} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {/* Donut */}
            <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Spending Breakdown</h3>
              {donutData.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "24px 0" }}>No expenses this month</div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <PieChart width={140} height={140}>
                      <Pie data={donutData} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={3}
                        onMouseEnter={(_, i) => setActiveSlice(i)} onMouseLeave={() => setActiveSlice(null)}>
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} opacity={activeSlice === null || activeSlice === i ? 1 : 0.4} />)}
                      </Pie>
                    </PieChart>
                    {activeSlice !== null && (
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{donutData[activeSlice]?.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{user.currency} {donutData[activeSlice]?.value.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {donutData.map(d => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.textSub, flex: 1 }}>{d.name}</span>
                        <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: C.text }}>{user.currency} {d.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Insights */}
            <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "120ms" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Insights</h3>
              {insights.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, padding: "24px 0" }}>Add more transactions to unlock insights</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {insights.map((ins, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.accentSoft, borderRadius: 12 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                      <span style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{ins.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category sparklines */}
          {catSparkData.some(c => c.data.some(d => d.v > 0)) && (
            <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Category Trends</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {catSparkData.filter(cat => cat.data.some(d => d.v > 0)).map(cat => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cat.icon}</div>
                    <span style={{ fontSize: 14, color: C.text, width: isMobile ? 70 : 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                    <div style={{ flex: 1, height: 36 }}>
                      <ResponsiveContainer width="100%" height={36}>
                        <LineChart data={cat.data}>
                          <Line type="monotone" dataKey="v" stroke={cat.trend > 0 ? C.expense : C.income} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span style={{ fontSize: 12, color: cat.trend > 0 ? C.expense : C.income, fontWeight: 600, width: 50, textAlign: "right", flexShrink: 0 }}>
                      {cat.trend !== 0 ? `${cat.trend > 0 ? "↑" : "↓"} ${Math.abs(Math.round(cat.trend))}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}