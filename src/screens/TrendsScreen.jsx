import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { springs } from "../tokens/springs";
import EmptyState from "../components/ui/EmptyState";

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

export default function TrendsScreen({ transactions, categories, user, C, selectedYear, isReadOnly }) {
  const isMobile = useIsMobile();
  const [activeSlice, setActiveSlice] = useState(null);
  const [view, setView] = useState("monthly"); // "monthly" | "weekly"

  const now = new Date();
  const year = selectedYear || now.getFullYear();

  // Show 12 months of the selected year, or last 6 months if current year
  const months = selectedYear && selectedYear !== now.getFullYear()
    ? Array.from({ length: 12 }, (_, i) => {
        const d = new Date(year, i, 1);
        return { label: d.toLocaleDateString("en-GB", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
      })
    : Array.from({ length: 6 }, (_, i) => {
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

  // Current year's spending by category (donut) — use last month of selected year with data
  const donutMonth = selectedYear && selectedYear !== now.getFullYear()
    ? transactions.filter(t => new Date(t.date).getFullYear() === year && t.type === "expense")
    : transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === "expense";
      });
  const thisMonth = donutMonth;
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
  const topCat = [...donutData].sort((a, b) => b.value - a.value)[0];
  const savingsRate = currentBarData?.income > 0
    ? Math.round(((currentBarData.income - currentBarData.expenses) / currentBarData.income) * 100)
    : 0;
  const expenseChange = prevBarData?.expenses > 0
    ? Math.round(((currentBarData?.expenses - prevBarData.expenses) / prevBarData.expenses) * 100)
    : null;

  // Per-category month-over-month changes
  const catChanges = categories.filter(c => !c.is_income).map(cat => {
    const curSpend = (currentBarData ? transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === months[months.length - 1].month && d.getFullYear() === months[months.length - 1].year && t.type === "expense" && t.categoryId === cat.id;
    }).reduce((s, t) => s + t.amount, 0) : 0);
    const prevSpend = (prevBarData ? transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === months[months.length - 2]?.month && d.getFullYear() === months[months.length - 2]?.year && t.type === "expense" && t.categoryId === cat.id;
    }).reduce((s, t) => s + t.amount, 0) : 0);
    const change = prevSpend > 0 ? Math.round(((curSpend - prevSpend) / prevSpend) * 100) : null;
    return { ...cat, curSpend, prevSpend, change };
  }).filter(c => c.change !== null && Math.abs(c.change) >= 10 && c.curSpend > 0);

  const biggestRise = [...catChanges].sort((a, b) => b.change - a.change)[0];
  const biggestDrop = [...catChanges].sort((a, b) => a.change - b.change)[0];

  const insights = [
    topCat && { icon: "💸", text: `Biggest spend: ${topCat.name} at ${user.currency} ${topCat.value.toLocaleString()}` },
    expenseChange !== null && { icon: expenseChange > 0 ? "📈" : "📉", text: `Overall spending is ${Math.abs(expenseChange)}% ${expenseChange > 0 ? "higher" : "lower"} than last month` },
    biggestRise && biggestRise.change > 20 && { icon: "⚠️", text: `${biggestRise.icon} ${biggestRise.name} is up ${biggestRise.change}% vs last month (${user.currency} ${biggestRise.prevSpend.toLocaleString()} → ${user.currency} ${biggestRise.curSpend.toLocaleString()})` },
    biggestDrop && biggestDrop.change < -10 && { icon: "✅", text: `${biggestDrop.icon} ${biggestDrop.name} is down ${Math.abs(biggestDrop.change)}% vs last month — nice work` },
    savingsRate > 0 && { icon: "💰", text: `Saving ${savingsRate}% of income this month${savingsRate >= 20 ? " — above the 20% target 🏆" : ""}` },
    savingsRate < 0 && { icon: "🚨", text: `Spending exceeds income this month by ${user.currency} ${Math.abs(currentBarData.income - currentBarData.expenses).toLocaleString()}` },
  ].filter(Boolean).slice(0, 5);

  // Weekly data — last 8 weeks
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      const end = new Date(now);
      end.setDate(now.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const label = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
      weeks.push({
        label,
        income: txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return weeks;
  }, [transactions]);

  const empty = transactions.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Trends</h1>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 3 }}>
          {["monthly", "weekly"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === v ? C.surface : "transparent",
              color: view === v ? C.text : C.textMuted,
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              boxShadow: view === v ? C.shadow : "none",
              transition: `all 200ms ${springs.snap}`,
            }}>{v}</button>
          ))}
        </div>
      </div>

      {empty ? (
        <EmptyState
          icon="📊"
          title="No data to show yet"
          description="Add a few income and expense transactions and Cove will chart your monthly and weekly spending patterns here."
          C={C}
        />
      ) : view === "weekly" ? (
        <>
          <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Income vs Expenses — Last 8 Weeks</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13 }} cursor={{ fill: C.surfaceHover }} formatter={(v) => `${user.currency} ${v.toLocaleString()}`} />
                <Bar dataKey="income" name="Income" fill={C.income} radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={C.expense} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Week-over-week summary */}
          <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Week Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {weeklyData.slice(-4).reverse().map((w, i) => {
                const prev = weeklyData[weeklyData.length - 2 - i];
                const change = prev?.expenses > 0 ? Math.round(((w.expenses - prev.expenses) / prev.expenses) * 100) : null;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.surfaceAlt, borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{i === 0 ? "This week" : i === 1 ? "Last week" : w.label}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>Spent {user.currency} {w.expenses.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: w.expenses > w.income && w.income > 0 ? C.expense : C.income }}>{user.currency} {w.income.toLocaleString()} in</div>
                      {change !== null && (
                        <div style={{ fontSize: 12, color: change > 0 ? C.expense : C.income, fontWeight: 600 }}>
                          {change > 0 ? "↑" : "↓"} {Math.abs(change)}% vs prev week
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
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