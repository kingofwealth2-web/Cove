import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { INIT_NOTIFICATIONS } from "../data/initial";

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
  const [notifications] = useState(INIT_NOTIFICATIONS);

  const uid = session?.user?.id;

  // ── Mappers ──────────────────────────────────────────────────────────────
  const mapCat  = c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, budget: c.budget_amount, group: c.group_name, rollover: c.rollover });
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
        { data: gls }, { data: dbs }, { data: ast }, { data: lib },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("categories").select("*").eq("user_id", uid).order("sort_order"),
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase.from("bills").select("*").eq("user_id", uid).order("due_day"),
        supabase.from("goals").select("*").eq("user_id", uid),
        supabase.from("debts").select("*").eq("user_id", uid),
        supabase.from("assets").select("*").eq("user_id", uid),
        supabase.from("liabilities").select("*").eq("user_id", uid),
      ]);
      setProfile(prof || null);
      setCategoriesState(cats?.length ? cats.map(mapCat) : []);
      setTransactionsState(txs?.length ? txs.map(mapTx) : []);
      setBillsState(bls?.length ? bls.map(mapBill) : []);
      setGoalsState(gls?.length ? gls.map(mapGoal) : []);
      setDebtsState(dbs?.length ? dbs.map(mapDebt) : []);
      setAssetsState(ast?.length ? ast.map(mapAsset) : []);
      setLiabilitiesState(lib?.length ? lib.map(mapLiab) : []);
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
  const saveOnboarding = async ({ name, income, currency, accent, theme }) => {
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + (now.getMonth() + 1);
    await supabase.from("profiles").upsert({
      id: uid, name, currency, accent_color: accent.value,
      theme, monthly_income: income, last_bill_reset: thisMonth,
    });
    const defaults = [
      { name: "Food",      icon: "🍔", color: "#FF9F0A", pct: 0.20, group: "Living",    rollover: false },
      { name: "Transport", icon: "🚗", color: "#5AC8FA", pct: 0.10, group: "Living",    rollover: false },
      { name: "Rent",      icon: "🏠", color: "#BF5AF2", pct: 0.30, group: "Living",    rollover: false },
      { name: "Utilities", icon: "💡", color: "#FF6B35", pct: 0.06, group: "Living",    rollover: true  },
      { name: "Health",    icon: "❤️", color: "#FF375F", pct: 0.07, group: "Wellness",  rollover: false },
      { name: "Fun",       icon: "🎉", color: "#6366F1", pct: 0.08, group: "Lifestyle", rollover: false },
      { name: "Savings",   icon: "💰", color: "#34C759", pct: 0.12, group: "Goals",     rollover: false },
      { name: "Education", icon: "📚", color: "#00C7BE", pct: 0.05, group: "Growth",    rollover: false },
    ];
    await supabase.from("categories").insert(
      defaults.map((c, i) => ({
        user_id: uid, name: c.name, icon: c.icon, color: c.color,
        budget_amount: Math.round(income * c.pct), group_name: c.group, rollover: c.rollover, sort_order: i,
      }))
    );
    await loadAll();
  };

  // ── Settings persistence ─────────────────────────────────────────────────
  const saveSettings = async (updates) => {
    const dbUpdates = {};
    if (updates.theme !== undefined)      dbUpdates.theme = updates.theme;
    if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
    if (updates.name !== undefined)       dbUpdates.name = updates.name;
    if (updates.currency !== undefined)   dbUpdates.currency = updates.currency;
    if (updates.income !== undefined)     dbUpdates.monthly_income = updates.income;
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
    // Delete removed rows
    const toDelete = [...prevIds].filter(id => !nextIds.has(id));
    for (const id of toDelete) {
      await supabase.from(table).delete().eq("id", id).eq("user_id", uid);
    }
    // Insert new / update existing
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
    await syncTable("categories", prev, next, (c, i) => ({
      name: c.name, icon: c.icon, color: c.color,
      budget_amount: c.budget, group_name: c.group, rollover: c.rollover,
      sort_order: next.indexOf(c),
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
    await syncTable("assets", prev, next, a => ({
      name: a.name, type: a.type, value: a.value,
    }));
  };

  // ── Liabilities ──────────────────────────────────────────────────────────
  const setLiabilities = async (updater) => {
    const prev = liabilities;
    const next = typeof updater === "function" ? updater(prev) : updater;
    setLiabilitiesState(next);
    await syncTable("liabilities", prev, next, l => ({
      name: l.name, type: l.type, balance: l.balance,
    }));
  };



  const [snapshots, setSnapshots] = useState([]);


  // ── Save net worth snapshot (once per month) ─────────────────────────────
  const saveNetworthSnapshot = async (netWorth) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const existing = snapshots.find(s => s.month === month);
    if (existing) {
      // Update if value changed
      if (existing.net_worth !== netWorth) {
        const { data } = await supabase.from("networth_snapshots")
          .update({ net_worth: netWorth })
          .eq("id", existing.id)
          .select().single();
        if (data) setSnapshots(ss => ss.map(s => s.id === data.id ? data : s));
      }
      return;
    }
    const { data } = await supabase.from("networth_snapshots")
      .insert({ user_id: uid, month, net_worth: netWorth })
      .select().single();
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
    transactions, categories, bills, goals, debts, assets, liabilities, notifications,
    addTransaction, deleteTransaction, updateTransaction,
    setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding, saveSettings, deleteAllData, snapshots, saveNetworthSnapshot,
  };
}