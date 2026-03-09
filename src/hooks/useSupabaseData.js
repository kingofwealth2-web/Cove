import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

export function useSupabaseData(session) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactionsState] = useState([]);
  const [categories, setCategoriesState] = useState([]);
  const [bills, setBillsState] = useState([]);
  const [goals, setGoalsState] = useState([]);
  const [debts, setDebtsState] = useState([]);
  const [assets, setAssetsState] = useState([]);
  const [liabilities, setLiabilitiesState] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  const uid = session?.user?.id;

  // ── Derived from profile ──────────────────────────────────────────────────
  const DEFAULT_NOTIF = { budgetWarning: true, overBudget: true, billReminder: true, streak: true, monthlyRecap: true };
  const notifSettings = profile?.notif_settings ? { ...DEFAULT_NOTIF, ...profile.notif_settings } : DEFAULT_NOTIF;
  const budgetMethod  = profile?.budget_method || "envelope";
  const pinHash       = profile?.pin_hash || null;

  const expenseCategories = categories.filter(c => !c.is_income);

  // ── Notifications generated from real data ──────────────────────────────
  const notifications = useMemo(() => {
    const now = new Date();
    const items = [];
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalIncome = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalSpent  = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const dayOfMonth  = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPct    = (dayOfMonth / daysInMonth) * 100;
    const spendPct    = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

    expenseCategories.forEach(cat => {
      const spent = monthTx.filter(t => t.type === "expense" && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
      if (cat.budget > 0 && spent > cat.budget && notifSettings.overBudget) {
        items.push({ id: `over-${cat.id}`, type: "over", title: `${cat.name} budget exceeded`, body: `You've spent ${spent.toLocaleString()} of your ${cat.budget.toLocaleString()} budget.`, time: "This month", read: false });
      } else if (cat.budget > 0 && spent / cat.budget > 0.8 && notifSettings.budgetWarning) {
        items.push({ id: `warn-${cat.id}`, type: "warning", title: `${cat.name} at 80%`, body: `You've used ${Math.round(spent/cat.budget*100)}% of your ${cat.name} budget.`, time: "This month", read: false });
      }
    });

    if (spendPct > monthPct + 15 && totalIncome > 0 && notifSettings.budgetWarning) {
      items.push({ id: "pace", type: "warning", title: "Spending ahead of pace", body: `You've spent ${Math.round(spendPct)}% of income but we're only ${Math.round(monthPct)}% through the month.`, time: "Today", read: false });
    }

    if (notifSettings.billReminder) {
      bills.filter(b => !b.paid && b.dueDay < dayOfMonth).forEach(b => {
        items.push({ id: `bill-${b.id}`, type: "bill", title: `${b.name} overdue`, body: `Payment of ${b.amount.toLocaleString()} was due on the ${b.dueDay}th.`, time: `Due ${b.dueDay}th`, read: false });
      });
      bills.filter(b => !b.paid && b.dueDay >= dayOfMonth && b.dueDay <= dayOfMonth + 3).forEach(b => {
        items.push({ id: `upcoming-${b.id}`, type: "bill", title: `${b.name} due soon`, body: `${b.amount.toLocaleString()} due on the ${b.dueDay}th.`, time: `In ${b.dueDay - dayOfMonth + 1} days`, read: false });
      });
    }

    if (dayOfMonth >= daysInMonth - 2 && totalIncome > 0 && notifSettings.monthlyRecap) {
      const saved = totalIncome - totalSpent;
      items.push({ id: "recap", type: "recap", title: "Month wrapping up", body: saved > 0 ? `You saved ${saved.toLocaleString()} this month. Great work!` : `You spent ${Math.abs(saved).toLocaleString()} more than you earned this month.`, time: "End of month", read: false });
    }

    if (transactions.length >= 5 && notifSettings.streak) {
      items.push({ id: "streak", type: "streak", title: "Staying on top of it", body: `You've logged ${transactions.length} transactions. Keep it up!`, time: "All time", read: true });
    }

    return items.length > 0 ? items : [{ id: "empty", type: "recap", title: "All clear", body: "No alerts right now. Add transactions to get personalised insights.", time: "Now", read: true }];
  }, [transactions, bills, expenseCategories, notifSettings]);

  // ── Mappers ──────────────────────────────────────────────────────────────
  const mapCat  = c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, budget: c.budget_amount, group: c.group_name, rollover: c.rollover, is_income: c.is_income || false });
  const mapTx   = t => ({ id: t.id, categoryId: t.category_id, amount: t.amount, type: t.type, note: t.note, date: t.date, isRecurring: t.is_recurring });
  const mapBill = b => ({ id: b.id, name: b.name, amount: b.amount, dueDay: b.due_day, categoryId: b.category_id, isSubscription: b.is_subscription, paid: b.paid });
  const mapGoal = g => ({ id: g.id, name: g.name, icon: g.icon, target: g.target_amount, current: g.current_amount, deadline: g.deadline, color: g.color, paused: g.paused });
  const mapDebt = d => ({ id: d.id, lender: d.lender, originalAmount: d.original_amount, currentBalance: d.current_balance, interestRate: d.interest_rate, minimumPayment: d.minimum_payment, dueDay: d.due_day, type: d.type });
  const mapAsset = a => ({ id: a.id, name: a.name, type: a.type, value: a.value });
  const mapLiab  = l => ({ id: l.id, name: l.name, type: l.type, balance: l.balance });

  // ── Load all ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [
        { data: prof }, { data: cats }, { data: txs }, { data: bls },
        { data: gls }, { data: dbs }, { data: ast }, { data: lib }, { data: snaps },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("categories").select("*").eq("user_id", uid).order("sort_order"),
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase.from("bills").select("*").eq("user_id", uid).order("due_day"),
        supabase.from("goals").select("*").eq("user_id", uid),
        supabase.from("debts").select("*").eq("user_id", uid),
        supabase.from("assets").select("*").eq("user_id", uid),
        supabase.from("liabilities").select("*").eq("user_id", uid),
        supabase.from("networth_snapshots").select("*").eq("user_id", uid).order("month"),
      ]);
      setProfile(prof || null);
      setCategoriesState(cats?.length ? cats.map(mapCat) : []);
      setTransactionsState(txs?.length ? txs.map(mapTx) : []);
      setBillsState(bls?.length ? bls.map(mapBill) : []);
      setGoalsState(gls?.length ? gls.map(mapGoal) : []);
      setDebtsState(dbs?.length ? dbs.map(mapDebt) : []);
      setAssetsState(ast?.length ? ast.map(mapAsset) : []);
      setLiabilitiesState(lib?.length ? lib.map(mapLiab) : []);
      setSnapshots(snaps || []);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Monthly bill reset ───────────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !profile || !bills.length) return;
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + (now.getMonth() + 1);
    if (profile.last_bill_reset === thisMonth) return;
    const reset = bills.map(b => ({ ...b, paid: false }));
    setBillsState(reset);
    supabase.from("bills").update({ paid: false }).eq("user_id", uid).then(() =>
      supabase.from("profiles").update({ last_bill_reset: thisMonth }).eq("id", uid)
    );
  }, [uid, profile?.last_bill_reset]);

  // ── Onboarding ───────────────────────────────────────────────────────────
  const saveOnboarding = async ({ name, incomeTypes = [], currency, accent, theme }) => {
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + (now.getMonth() + 1);
    await supabase.from("profiles").upsert({
      id: uid, name, currency, accent_color: accent.value,
      theme, monthly_income: 0, last_bill_reset: thisMonth,
      budget_method: "envelope",
      notif_settings: { budgetWarning: true, overBudget: true, billReminder: true, streak: true, monthlyRecap: true },
    });

    const incomeCategories = {
      salary:    { name: "Salary",        icon: "💼", color: "#34C759" },
      freelance: { name: "Freelance",      icon: "💻", color: "#5AC8FA" },
      business:  { name: "Business",       icon: "🏪", color: "#FF9F0A" },
      hustle:    { name: "Side Hustle",    icon: "⚡", color: "#BF5AF2" },
      family:    { name: "Family Support", icon: "🤝", color: "#6366F1" },
      mixed:     { name: "Other Income",   icon: "💸", color: "#00C7BE" },
    };
    const selectedIncome = incomeTypes.length > 0
      ? incomeTypes.map(id => incomeCategories[id]).filter(Boolean)
      : [{ name: "Income", icon: "💸", color: "#34C759" }];

    const expenseDefaults = [
      { name: "Food",      icon: "🍔", color: "#FF9F0A", group: "Living"    },
      { name: "Transport", icon: "🚗", color: "#5AC8FA", group: "Living"    },
      { name: "Health",    icon: "❤️", color: "#FF375F", group: "Wellness"  },
      { name: "Fun",       icon: "🎉", color: "#6366F1", group: "Lifestyle" },
      { name: "Savings",   icon: "💰", color: "#34C759", group: "Goals"     },
      { name: "Other",     icon: "📦", color: "#8E8E93", group: "Other"     },
    ];

    const allCats = [
      ...selectedIncome.map((c, i) => ({
        user_id: uid, name: c.name, icon: c.icon, color: c.color,
        budget_amount: 0, group_name: "Income", rollover: false,
        sort_order: i, is_income: true,
      })),
      ...expenseDefaults.map((c, i) => ({
        user_id: uid, name: c.name, icon: c.icon, color: c.color,
        budget_amount: 0, group_name: c.group, rollover: false,
        sort_order: selectedIncome.length + i, is_income: false,
      })),
    ];

    const { data: insertedCats } = await supabase.from("categories").insert(allCats).select();
    if (insertedCats) setCategoriesState(insertedCats.map(mapCat));
    await loadAll();
  };

  // ── Settings ─────────────────────────────────────────────────────────────
  const saveSettings = async (updates) => {
    const dbUpdates = {};
    if (updates.theme !== undefined)        dbUpdates.theme = updates.theme;
    if (updates.accentColor !== undefined)  dbUpdates.accent_color = updates.accentColor;
    if (updates.name !== undefined)         dbUpdates.name = updates.name;
    if (updates.currency !== undefined)     dbUpdates.currency = updates.currency;
    if (updates.income !== undefined)       dbUpdates.monthly_income = updates.income;
    if (updates.budgetMethod !== undefined) dbUpdates.budget_method = updates.budgetMethod;
    if (updates.notifSettings !== undefined) dbUpdates.notif_settings = updates.notifSettings;
    if (updates.pinHash !== undefined)      dbUpdates.pin_hash = updates.pinHash;
    if (!Object.keys(dbUpdates).length) return;
    await supabase.from("profiles").update(dbUpdates).eq("id", uid);
    setProfile(p => ({ ...p, ...dbUpdates }));
  };

  // ── Transactions ─────────────────────────────────────────────────────────
  const addTransaction = async (tx) => {
    const { data } = await supabase.from("transactions").insert({
      user_id: uid, category_id: tx.categoryId || null,
      amount: tx.amount, type: tx.type, note: tx.note, date: tx.date, is_recurring: tx.isRecurring,
    }).select().single();
    if (data) setTransactionsState(ts => [mapTx(data), ...ts]);
  };

  const deleteTransaction = async (id) => {
    setTransactionsState(ts => ts.filter(t => t.id !== id));
    await supabase.from("transactions").delete().eq("id", id).eq("user_id", uid);
  };

  const updateTransaction = async (id, updates) => {
    setTransactionsState(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t));
    await supabase.from("transactions").update({
      category_id: updates.categoryId || null, amount: updates.amount,
      type: updates.type, note: updates.note, date: updates.date, is_recurring: updates.isRecurring,
    }).eq("id", id).eq("user_id", uid);
  };

  // ── Generic upsert/delete helper ─────────────────────────────────────────
  const syncTable = async (table, prev, next, toRow) => {
    const prevIds = new Set(prev.map(x => x.id));
    const nextIds = new Set(next.map(x => x.id));
    const toDelete = [...prevIds].filter(id => !nextIds.has(id));
    for (const id of toDelete) {
      await supabase.from(table).delete().eq("id", id).eq("user_id", uid);
    }
    for (const item of next) {
      const row = { ...toRow(item), user_id: uid };
      if (!prevIds.has(item.id)) {
        await supabase.from(table).insert(row);
      } else {
        await supabase.from(table).update(row).eq("id", item.id).eq("user_id", uid);
      }
    }
  };

  // ── Categories ───────────────────────────────────────────────────────────
  const setCategories = async (updater) => {
    const prev = categories;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setCategoriesState(next);
    await syncTable("categories", prev, next, (c) => ({
      name: c.name, icon: c.icon, color: c.color,
      budget_amount: c.budget, group_name: c.group, rollover: c.rollover,
      is_income: c.is_income || false, sort_order: next.indexOf(c),
    }));
  };

  // ── Bills ────────────────────────────────────────────────────────────────
  const setBills = async (updater) => {
    const prev = bills;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setBillsState(next);
    await syncTable("bills", prev, next, b => ({
      name: b.name, amount: b.amount, due_day: b.dueDay,
      is_subscription: b.isSubscription, paid: b.paid, category_id: b.categoryId || null,
    }));
  };

  // ── Goals ────────────────────────────────────────────────────────────────
  const setGoals = async (updater) => {
    const prev = goals;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setGoalsState(next);
    await syncTable("goals", prev, next, g => ({
      name: g.name, icon: g.icon, target_amount: g.target,
      current_amount: g.current || 0, deadline: g.deadline || null,
      color: g.color, paused: g.paused || false,
    }));
  };

  // ── Debts ────────────────────────────────────────────────────────────────
  const setDebts = async (updater) => {
    const prev = debts;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setDebtsState(next);
    await syncTable("debts", prev, next, d => ({
      lender: d.lender, original_amount: d.originalAmount,
      current_balance: d.currentBalance, interest_rate: d.interestRate || 0,
      minimum_payment: d.minimumPayment || 0, due_day: d.dueDay || 1, type: d.type || "loan",
    }));
  };

  // ── Assets ───────────────────────────────────────────────────────────────
  const setAssets = async (updater) => {
    const prev = assets;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setAssetsState(next);
    await syncTable("assets", prev, next, a => ({ name: a.name, type: a.type, value: a.value }));
  };

  // ── Liabilities ──────────────────────────────────────────────────────────
  const setLiabilities = async (updater) => {
    const prev = liabilities;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setLiabilitiesState(next);
    await syncTable("liabilities", prev, next, l => ({ name: l.name, type: l.type, balance: l.balance }));
  };

  // ── Net worth snapshots ──────────────────────────────────────────────────
  const saveNetworthSnapshot = async (netWorth) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const existing = snapshots.find(s => s.month === month);
    if (existing) {
      if (existing.net_worth !== netWorth) {
        const { data } = await supabase.from("networth_snapshots").update({ net_worth: netWorth }).eq("id", existing.id).select().single();
        if (data) setSnapshots(ss => ss.map(s => s.id === data.id ? data : s));
      }
      return;
    }
    const { data } = await supabase.from("networth_snapshots").insert({ user_id: uid, month, net_worth: netWorth }).select().single();
    if (data) setSnapshots(ss => [...ss, data]);
  };

  // ── Delete all user data ─────────────────────────────────────────────────
  const deleteAllData = async () => {
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", uid),
      supabase.from("categories").delete().eq("user_id", uid),
      supabase.from("bills").delete().eq("user_id", uid),
      supabase.from("goals").delete().eq("user_id", uid),
      supabase.from("debts").delete().eq("user_id", uid),
      supabase.from("assets").delete().eq("user_id", uid),
      supabase.from("liabilities").delete().eq("user_id", uid),
    ]);
    setTransactionsState([]);
    setCategoriesState([]);
    setBillsState([]);
    setGoalsState([]);
    setDebtsState([]);
    setAssetsState([]);
    setLiabilitiesState([]);
  };

  return {
    profile, loading,
    transactions, categories, bills, goals, debts, assets, liabilities,
    notifications, notifSettings, budgetMethod, pinHash,
    addTransaction, deleteTransaction, updateTransaction,
    setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding, saveSettings, deleteAllData, snapshots, saveNetworthSnapshot,
  };
}