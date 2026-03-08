import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { springs } from "../tokens/springs";
import { TREND_DATA } from "../data/initial";


export default function TrendsScreen({ transactions, categories, user, C }) {
  const [selectedMonth, setSelectedMonth] = useState(5);
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const insights = [
    { icon: "📈", text: "You spent 22% more on Food than last month" },
    { icon: "🏆", text: "Your best saving month was January" },
    { icon: "💸", text: `Biggest expense: Rent (${user.currency} 1,200)` },
    { icon: "🔥", text: "You've logged 47 transactions — great habit!" },
    { icon: "💡", text: "You're on track to save 12% this month" },
  ];

  const donutData = categories.slice(0, 5).map(cat => ({
    name: cat.name, value: Math.round(Math.random() * 400 + 100), color: cat.color,
  }));
  const [activeSlice, setActiveSlice] = useState(null);

  const sparkData = Array.from({ length: 6 }, (_, i) => ({ v: Math.round(Math.random() * 300 + 100) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px", animation: `slideUp 300ms ${springs.bounce}` }}>Trends</h1>

      {/* Month pills */}
      <div style={{ display: "flex", gap: 8, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        {months.map((m, i) => (
          <button key={m} onClick={() => setSelectedMonth(i)} style={{
            padding: "8px 18px", borderRadius: 99, border: "none", cursor: "pointer",
            background: selectedMonth === i ? C.accent : C.surfaceAlt,
            color: selectedMonth === i ? "white" : C.textSub,
            fontSize: 13, fontWeight: 600,
            boxShadow: selectedMonth === i ? `0 4px 16px ${C.accentGlow}` : "none",
            transition: `all 250ms ${springs.snap}`,
          }}>{m}</button>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "80ms" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={TREND_DATA} barGap={4} barCategoryGap="30%">
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 12 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13 }}
              cursor={{ fill: C.surfaceHover }}
            />
            <Bar dataKey="income" fill={C.income} radius={[6, 6, 0, 0]}
              opacity={d => TREND_DATA.indexOf(d) === selectedMonth ? 1 : 0.35}
            />
            <Bar dataKey="expenses" fill={C.expense} radius={[6, 6, 0, 0]}
              opacity={d => TREND_DATA.indexOf(d) === selectedMonth ? 1 : 0.35}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Donut chart */}
        <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "120ms" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Spending Breakdown</h3>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{donutData[activeSlice]?.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{user.currency} {donutData[activeSlice]?.value}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {donutData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.textSub, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: C.text }}>{user.currency} {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "160ms" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.accentSoft, borderRadius: 12 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                <span style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category sparklines */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "24px", border: `1px solid ${C.border}`, boxShadow: C.shadow, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "200ms" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Category Trends</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {categories.slice(0, 5).map(cat => {
            const data = Array.from({ length: 6 }, (_, i) => ({ v: Math.round(Math.random() * cat.budget * 0.6 + cat.budget * 0.2) }));
            const trend = data[5].v - data[0].v;
            return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cat.icon}</div>
                <span style={{ fontSize: 14, color: C.text, width: 100, flexShrink: 0 }}>{cat.name}</span>
                <div style={{ flex: 1, height: 36 }}>
                  <ResponsiveContainer width="100%" height={36}>
                    <LineChart data={data}>
                      <Line type="monotone" dataKey="v" stroke={trend > 0 ? C.expense : C.income} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <span style={{ fontSize: 12, color: trend > 0 ? C.expense : C.income, fontWeight: 600, width: 50, textAlign: "right", flexShrink: 0 }}>
                  {trend > 0 ? "↑" : "↓"} {Math.abs(Math.round(trend / 10))}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLS SCREEN
// ─────────────────────────────────────────────────────────────────────────────