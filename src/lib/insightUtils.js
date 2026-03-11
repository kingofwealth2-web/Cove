/**
 * Compute proactive financial insights from user data.
 * Pure function — no imports, no side effects.
 * Used by both AskCoveScreen (display) and App.jsx (nav badge count).
 */
export function computeInsights(user, transactions, categories, goals, bills) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPct = dayOfMonth / daysInMonth;

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const income      = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense     = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const safeToSpend = income - expense;

  const insights = [];

  // 1. Negative safe-to-spend
  if (income > 0 && safeToSpend < 0) {
    insights.push({
      id: "overbudget",
      severity: "critical",
      icon: "🚨",
      title: `Over budget by ${user.currency} ${Math.abs(safeToSpend).toLocaleString()}`,
      detail: `You've spent ${user.currency} ${expense.toLocaleString()} but only logged ${user.currency} ${income.toLocaleString()} income this month.`,
      prompt: `I'm over budget by ${user.currency} ${Math.abs(safeToSpend).toLocaleString()} this month. What should I do?`,
    });
  }

  // 2. Spending ahead of pace
  if (income > 0 && safeToSpend >= 0) {
    const spendPct = expense / income;
    if (spendPct > monthPct + 0.15) {
      insights.push({
        id: "pace",
        severity: "warning",
        icon: "⚡",
        title: "Spending ahead of schedule",
        detail: `${Math.round(spendPct * 100)}% of income spent with only ${Math.round(monthPct * 100)}% of the month gone.`,
        prompt: "My spending is ahead of schedule this month. Where is the money going and how do I slow down?",
      });
    } else if (spendPct < monthPct - 0.2 && dayOfMonth >= 10) {
      insights.push({
        id: "ontrack",
        severity: "positive",
        icon: "✅",
        title: "You're well on track",
        detail: `Only ${Math.round(spendPct * 100)}% of income spent at day ${dayOfMonth}. Keep it up.`,
        prompt: "I'm well within budget this month. What's the best use of my remaining safe-to-spend?",
      });
    }
  }

  // 3. Category over budget
  const expCats = categories.filter(c => !c.is_income && c.budget > 0);
  const overCats = expCats.map(cat => {
    const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
    return { ...cat, spent, pct: spent / cat.budget };
  }).filter(c => c.pct >= 1).sort((a, b) => b.pct - a.pct);

  if (overCats.length > 0) {
    const top = overCats[0];
    insights.push({
      id: "cat_over_" + top.id,
      severity: "warning",
      icon: top.icon,
      title: `${top.name} is over budget`,
      detail: `Spent ${user.currency} ${top.spent.toLocaleString()} of ${user.currency} ${top.budget.toLocaleString()} (${Math.round(top.pct * 100)}%)${overCats.length > 1 ? ` · ${overCats.length - 1} more over limit` : ""}.`,
      prompt: `My ${top.name} spending is at ${Math.round(top.pct * 100)}% of budget. How can I cut back?`,
    });
  }

  // 4. Category approaching limit
  if (overCats.length === 0) {
    const nearCats = expCats.map(cat => {
      const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      return { ...cat, spent, pct: spent / cat.budget };
    }).filter(c => {
      const threshold = c.alertAt ? c.alertAt / 100 : 0.8;
      return c.pct >= threshold && c.pct < 1;
    }).sort((a, b) => b.pct - a.pct);

    if (nearCats.length > 0) {
      const top = nearCats[0];
      insights.push({
        id: "cat_near_" + top.id,
        severity: "warning",
        icon: top.icon,
        title: `${top.name} is at ${Math.round(top.pct * 100)}% of budget`,
        detail: `${user.currency} ${(top.budget - top.spent).toLocaleString()} remaining for the rest of the month.`,
        prompt: `My ${top.name} budget is ${Math.round(top.pct * 100)}% used. How should I manage the rest of the month?`,
      });
    }
  }

  // 5. Bills overdue / due soon
  const unpaidBills = bills.filter(b => !b.paid);
  const dueSoon = unpaidBills.filter(b => b.dueDay >= dayOfMonth && b.dueDay <= dayOfMonth + 5);
  const overdue  = unpaidBills.filter(b => b.dueDay < dayOfMonth);

  if (overdue.length > 0) {
    const total = overdue.reduce((s, b) => s + b.amount, 0);
    insights.push({
      id: "overdue_bills",
      severity: "critical",
      icon: "📋",
      title: `${overdue.length} overdue bill${overdue.length !== 1 ? "s" : ""}`,
      detail: `${overdue.map(b => b.name).join(", ")} — totalling ${user.currency} ${total.toLocaleString()}.`,
      prompt: `I have ${overdue.length} overdue bill${overdue.length !== 1 ? "s" : ""}: ${overdue.map(b => b.name).join(", ")}. What should I prioritise?`,
    });
  } else if (dueSoon.length > 0) {
    const total = dueSoon.reduce((s, b) => s + b.amount, 0);
    insights.push({
      id: "due_soon",
      severity: "info",
      icon: "📅",
      title: `${dueSoon.length} bill${dueSoon.length !== 1 ? "s" : ""} due in the next 5 days`,
      detail: `${dueSoon.map(b => b.name).join(", ")} — ${user.currency} ${total.toLocaleString()} total.`,
      prompt: `I have bills due soon: ${dueSoon.map(b => `${b.name} (${user.currency} ${b.amount})`).join(", ")}. Do I have enough safe-to-spend to cover them?`,
    });
  }

  // 6. Goal deadline at risk
  const atRiskGoals = goals.filter(g => {
    if (!g.deadline || g.completed || g.paused) return false;
    const daysLeft = Math.ceil((new Date(g.deadline) - now) / 86400000);
    if (daysLeft <= 0 || daysLeft > 90) return false;
    const remaining = g.target - g.current;
    const neededPerDay = remaining / daysLeft;
    const avgDailyIncome = income / dayOfMonth;
    return remaining > 0 && neededPerDay > avgDailyIncome * 0.3;
  });

  if (atRiskGoals.length > 0) {
    const g = atRiskGoals[0];
    const daysLeft = Math.ceil((new Date(g.deadline) - now) / 86400000);
    const remaining = g.target - g.current;
    insights.push({
      id: "goal_risk_" + g.id,
      severity: "warning",
      icon: g.icon,
      title: `${g.name} deadline approaching`,
      detail: `${user.currency} ${remaining.toLocaleString()} still needed in ${daysLeft} days.`,
      prompt: `My ${g.name} goal has ${daysLeft} days left and still needs ${user.currency} ${remaining.toLocaleString()}. Am I on track?`,
    });
  }

  // 7. No income logged yet
  if (income === 0 && dayOfMonth >= 5 && transactions.length > 0) {
    insights.push({
      id: "no_income",
      severity: "info",
      icon: "💰",
      title: "No income logged this month",
      detail: "Add your salary or any income so Cove can calculate your safe-to-spend accurately.",
      prompt: "I haven't logged any income this month yet. How does that affect my safe-to-spend?",
    });
  }

  // 8. Spending spike vs last month
  if (lastMonthTx.length > 0 && dayOfMonth >= 7) {
    expCats.forEach(cat => {
      const thisSpent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      const lastSpent = lastMonthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      const lastNorm = lastSpent * monthPct;
      if (lastNorm > 0 && thisSpent > lastNorm * 1.5 && thisSpent > 50) {
        insights.push({
          id: "spike_" + cat.id,
          severity: "info",
          icon: cat.icon,
          title: `${cat.name} spending up vs last month`,
          detail: `${user.currency} ${thisSpent.toLocaleString()} so far vs ${user.currency} ${Math.round(lastSpent).toLocaleString()} all of last month.`,
          prompt: `My ${cat.name} spending is higher than last month. Can you help me understand why and what to do?`,
        });
      }
    });
  }

  const order = { critical: 0, warning: 1, info: 2, positive: 3 };
  return insights
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 4);
}