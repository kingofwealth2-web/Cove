import { useState, useRef, useEffect, useMemo } from "react";
import { springs } from "../tokens/springs";
import { computeInsights } from "../lib/insightUtils";

// ── Build rich financial context for the AI ──────────────────────────────────
function buildSystemPrompt(user, transactions, categories, goals, debts, bills) {
  const now = new Date();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income  = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const safeToSpend = income - expense;

  const expCats = categories.filter(c => !c.is_income);
  const catBreakdown = expCats.map(cat => {
    const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
    const pct = cat.budget > 0 ? Math.round(spent / cat.budget * 100) : null;
    return `  - ${cat.icon} ${cat.name}: spent ${user.currency} ${spent.toLocaleString()}${cat.budget > 0 ? ` of ${user.currency} ${cat.budget.toLocaleString()} budget (${pct}%)` : " (no limit set)"}`;
  }).join("\n");

  const recentTx = transactions.slice(0, 30).map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    return `  ${t.date} | ${t.type === "income" ? "+" : "-"}${user.currency} ${t.amount.toLocaleString()} | ${cat?.name || "Uncategorised"}${t.note ? ` | ${t.note}` : ""}`;
  }).join("\n");

  const goalsSummary = goals.length ? goals.map(g => {
    const pct = g.target > 0 ? Math.round(g.current / g.target * 100) : 0;
    return `  - ${g.icon} ${g.name}: ${user.currency} ${g.current.toLocaleString()} of ${user.currency} ${g.target.toLocaleString()} (${pct}%)${g.deadline ? `, deadline ${g.deadline}` : ""}`;
  }).join("\n") : "  None";

  const debtsSummary = debts.length ? debts.map(d =>
    `  - ${d.lender}: ${user.currency} ${d.currentBalance.toLocaleString()} remaining (${d.interestRate}% interest)`
  ).join("\n") : "  None";

  const unpaidBills = bills.filter(b => !b.paid);
  const billsSummary = unpaidBills.length ? unpaidBills.map(b =>
    `  - ${b.name}: ${user.currency} ${b.amount.toLocaleString()} due on the ${b.dueDay}th`
  ).join("\n") : "  None this month";

  return `You are Cove, a personal finance assistant built into the Cove budgeting app. You have access to ${user.name}'s real financial data. Speak directly and personally — use their name occasionally. Be concise, warm and practical. Never give generic advice when you have real numbers to work with. Use ${user.currency} for all amounts. Today is ${now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

## ${user.name}'s Finances — ${now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}

**This month:**
- Income logged: ${user.currency} ${income.toLocaleString()}
- Total spent: ${user.currency} ${expense.toLocaleString()}
- Safe to spend: ${user.currency} ${safeToSpend.toLocaleString()} ${safeToSpend < 0 ? "(over budget ⚠️)" : ""}

**Spending by category:**
${catBreakdown || "  No expenses logged yet"}

**Recent transactions (last 30):**
${recentTx || "  No transactions yet"}

**Savings goals:**
${goalsSummary}

**Debts:**
${debtsSummary}

**Upcoming bills:**
${billsSummary}

Answer questions about this data honestly. If something looks concerning, say so gently. If asked about things outside this data, say so clearly. Keep replies focused — no bullet-point essays unless the user specifically asks for a breakdown.`;
}

// ── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, onTap, C }) {
  const [hov, setHov] = useState(false);
  const colors = {
    critical: { bg: C.expenseSoft, border: C.expense + "50", text: C.expense },
    warning:  { bg: C.warningSoft || C.accentSoft, border: (C.warning || C.accent) + "50", text: C.warning || C.accent },
    info:     { bg: C.accentSoft, border: C.accent + "40", text: C.accent },
    positive: { bg: C.incomeSoft, border: C.income + "40", text: C.income },
  };
  const col = colors[insight.severity] || colors.info;

  return (
    <button
      onClick={() => onTap(insight.prompt)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: hov ? col.bg : C.surface,
        border: `1px solid ${hov ? col.border : C.border}`,
        borderRadius: 16, padding: "14px 16px",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: `all 200ms ${springs.snap}`,
        transform: hov ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hov ? C.shadowLg : C.shadow,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: col.bg, border: `1px solid ${col.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>{insight.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{insight.title}</div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{insight.detail}</div>
      </div>
      <div style={{ color: C.textMuted, fontSize: 16, flexShrink: 0, marginTop: 2, transition: `transform 150ms` , transform: hov ? "translateX(2px)" : "translateX(0)" }}>›</div>
    </button>
  );
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function MessageText({ text, C }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ color: C.text, fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : p
      )}
    </span>
  );
}

// ── Suggested prompts ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "How am I doing this month?",
  "Where am I overspending?",
  "Am I on track with my goals?",
  "Summarise my finances",
  "How can I save more?",
  "What's my biggest expense?",
];

// ── Daily brief via AI ────────────────────────────────────────────────────────
async function fetchDailyBrief(systemPrompt) {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `cove_brief_${today}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      messages: [{
        role: "user",
        content: "Give me a concise 2–3 sentence financial brief for today. Be specific with real numbers from my data. Highlight the single most important thing I should act on right now. No intro like 'Sure!' — just the brief.",
      }],
    }),
  });
  const data = await res.json();
  const reply = data.reply || "";
  if (reply) sessionStorage.setItem(cacheKey, reply);
  return reply;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AskCoveScreen({ transactions, categories, goals, debts, bills, user, C, onInsightsSeen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyBrief, setDailyBrief] = useState(null); // null | "loading" | string
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const systemPrompt = useMemo(
    () => buildSystemPrompt(user, transactions, categories, goals, debts, bills),
    [user, transactions, categories, goals, debts, bills]
  );

  const insights = useMemo(
    () => computeInsights(user, transactions, categories, goals, bills),
    [user, transactions, categories, goals, bills]
  );

  // Mark insights as seen when screen opens
  useEffect(() => {
    onInsightsSeen?.();
  }, []);

  // Fetch AI daily brief once per day
  useEffect(() => {
    if (!systemPrompt || transactions.length === 0) return;
    setDailyBrief("loading");
    fetchDailyBrief(systemPrompt)
      .then(brief => setDailyBrief(brief || null))
      .catch(() => setDailyBrief(null));
  }, [systemPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput("");
    setError("");

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError("Something went wrong. Please try again.");
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Connection error. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;
  const hasInsights = insights.length > 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "calc(100vh - 48px)",
      maxWidth: 720, margin: "0 auto", gap: 0,
      animation: `slideUp 300ms ${springs.bounce}`,
    }}>

      {/* Empty state */}
      {isEmpty && (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, padding: "24px 4px 8px" }}>

          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 8 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, boxShadow: `0 12px 40px ${C.accentGlow}`,
            }}>✦</div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>Ask Cove</h2>
              <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
                Your finances, explained. Ask anything or tap an insight below.
              </p>
            </div>
          </div>

          {/* Daily Brief */}
          {(dailyBrief === "loading" || dailyBrief) && (
            <div style={{
              padding: "16px 18px", borderRadius: 18,
              background: `linear-gradient(135deg, ${C.accent}18, ${C.accentDark || C.accent}10)`,
              border: `1px solid ${C.accent}30`,
              animation: `slideUp 300ms ${springs.bounce}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dailyBrief === "loading" ? 0 : 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, boxShadow: `0 4px 10px ${C.accentGlow}`,
                }}>✦</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Today's Brief
                </div>
              </div>
              {dailyBrief === "loading" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}>
                  <style>{`
                    @keyframes briefPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
                  `}</style>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      height: 8, borderRadius: 4, background: C.accent + "60",
                      width: i === 0 ? 120 : i === 1 ? 80 : 100,
                      animation: `briefPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6, margin: 0 }}>
                  <MessageText text={dailyBrief} C={C} />
                </p>
              )}
            </div>
          )}

          {/* Proactive insights */}
          {hasInsights && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 2 }}>
                Right now
              </div>
              {insights.map((ins, i) => (
                <div key={ins.id} style={{ animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${i * 60}ms` }}>
                  <InsightCard insight={ins} onTap={send} C={C} />
                </div>
              ))}
            </div>
          )}

          {/* Suggestion chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 2 }}>
              Ask anything
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  padding: "8px 16px", borderRadius: 99,
                  border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textSub,
                  fontSize: 13, cursor: "pointer",
                  transition: `all 200ms ${springs.snap}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = C.surface; }}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message list */}
      {!isEmpty && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 4px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              animation: `slideUp 200ms ${springs.bounce}`,
            }}>
              {m.role === "assistant" && (
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginRight: 10, marginTop: 2,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, boxShadow: `0 4px 12px ${C.accentGlow}`,
                }}>✦</div>
              )}
              <div style={{
                maxWidth: "78%", padding: "12px 16px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? C.accent : C.surface,
                color: m.role === "user" ? "white" : C.textSub,
                fontSize: 14, boxShadow: C.shadow,
                border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
              }}>
                <MessageText text={m.content} C={{ ...C, text: m.role === "user" ? "white" : C.text }} />
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark || C.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, boxShadow: `0 4px 12px ${C.accentGlow}`,
              }}>✦</div>
              <div style={{
                padding: "14px 18px", borderRadius: "18px 18px 18px 4px",
                background: C.surface, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <style>{`
                  @keyframes dotBounce {
                    0%,80%,100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-6px); opacity: 1; }
                  }
                `}</style>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.accent,
                    animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 12, background: C.expenseSoft, color: C.expense, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: isEmpty ? "0 0 8px" : "8px 0 8px",
        borderTop: isEmpty ? "none" : `1px solid ${C.border}`,
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: C.surface, borderRadius: 18,
          border: `1px solid ${C.border}`,
          padding: "10px 10px 10px 18px",
          boxShadow: C.shadow,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything about your finances…"
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none", resize: "none",
              fontSize: 14, color: C.text, lineHeight: 1.5, fontFamily: "inherit",
              overflow: "hidden", minHeight: 22,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: 12, border: "none", flexShrink: 0,
              background: input.trim() && !loading ? C.accent : C.surfaceAlt,
              color: input.trim() && !loading ? "white" : C.textMuted,
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: `all 200ms ${springs.snap}`,
              boxShadow: input.trim() && !loading ? `0 4px 16px ${C.accentGlow}` : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        {!isEmpty && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => setMessages([])} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: C.textMuted,
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
            >Clear conversation</button>
          </div>
        )}
      </div>
    </div>
  );
}