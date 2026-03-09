import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  INIT_CATEGORIES, INIT_TRANSACTIONS, INIT_BILLS,
  INIT_GOALS, INIT_DEBTS, INIT_ASSETS, INIT_LIABILITIES, INIT_NOTIFICATIONS,
} from "../data/initial";

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

  // ── Load all data ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [
        { data: prof },
        { data: cats },
        { data: txs },
        { data: bls },
        { data: gls },
        { data: dbs },
        { data: ast },
        { data: lib },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("categories").select("*").eq("user_id", uid).order("sort_order"),
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase.from("bills").select("*").eq("user_id", uid),
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
      setAssetsState(ast?.length ? ast : []);
      setLiabilitiesState(lib?.length ? lib : []);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Mappers (DB → app shape) ─────────────────────────────────────────────
  const mapCat = c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, budget: c.budget_amount, group: c.group_name, rollover: c.rollover });
  const mapTx = t => ({ id: t.id, categoryId: t.category_id, amount: t.amount, type: t.type, note: t.note, date: t.date, isRecurring: t.is_recurring });
  const mapBill = b => ({ id: b.id, name: b.name, amount: b.amount, dueDay: b.due_day, categoryId: b.category_id, isSubscription: b.is_subscription, paid: b.paid });
  const mapGoal = g => ({ id: g.id, name: g.name, icon: g.icon, target: g.target_amount, current: g.current_amount, deadline: g.deadline, color: g.color, paused: g.paused });
  const mapDebt = d => ({ id: d.id, lender: d.lender, originalAmount: d.original_amount, currentBalance: d.current_balance, interestRate: d.interest_rate, minimumPayment: d.minimum_payment, dueDay: d.due_day, type: d.type });

  // ── Onboarding: save profile + seed default categories only ────────────────
  const saveOnboarding = async ({ name, income, currency, accent, theme }) => {
    // Save profile
    await supabase.from("profiles").upsert({
      id: uid, name, currency,
      accent_color: accent.value,
      theme,
      monthly_income: income,
    });

    // Seed default categories (no transactions/bills/goals — user starts fresh)
    const defaultCategories = [
      { name: "Food", icon: "🍔", color: "#FF9F0A", budget: Math.round(income * 0.20), group: "Living", rollover: false },
      { name: "Transport", icon: "🚗", color: "#5AC8FA", budget: Math.round(income * 0.10), group: "Living", rollover: false },
      { name: "Rent", icon: "🏠", color: "#BF5AF2", budget: Math.round(income * 0.30), group: "Living", rollover: false },
      { name: "Utilities", icon: "💡", color: "#FF6B35", budget: Math.round(income * 0.06), group: "Living", rollover: true },
      { name: "Health", icon: "❤️", color: "#FF375F", budget: Math.round(income * 0.07), group: "Wellness", rollover: false },
      { name: "Fun", icon: "🎉", color: "#6366F1", budget: Math.round(income * 0.08), group: "Lifestyle", rollover: false },
      { name: "Savings", icon: "💰", color: "#34C759", budget: Math.round(income * 0.12), group: "Goals", rollover: false },
      { name: "Education", icon: "📚", color: "#00C7BE", budget: Math.round(income * 0.05), group: "Growth", rollover: false },
    ];

    const cats = defaultCategories.map((c, i) => ({
      user_id: uid, name: c.name, icon: c.icon, color: c.color,
      budget_amount: c.budget, group_name: c.group, rollover: c.rollover, sort_order: i,
    }));
    await supabase.from("categories").insert(cats);

    await loadAll();
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
    const mapped = {
      category_id: updates.categoryId || null,
      amount: updates.amount, type: updates.type,
      note: updates.note, date: updates.date, is_recurring: updates.isRecurring,
    };
    setTransactionsState(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t));
    await supabase.from("transactions").update(mapped).eq("id", id).eq("user_id", uid);
  };

  // ── Categories ───────────────────────────────────────────────────────────
  const setCategories = async (updater) => {
    const next = typeof updater === "function" ? updater(categories) : updater;
    setCategoriesState(next);
    // Sync changed categories back
    for (const cat of next) {
      await supabase.from("categories").update({
        name: cat.name, icon: cat.icon, color: cat.color,
        budget_amount: cat.budget, group_name: cat.group, rollover: cat.rollover,
      }).eq("id", cat.id).eq("user_id", uid);
    }
  };

  // ── Bills ────────────────────────────────────────────────────────────────
  const setBills = async (updater) => {
    const next = typeof updater === "function" ? updater(bills) : updater;
    setBillsState(next);
    for (const bill of next) {
      await supabase.from("bills").update({ paid: bill.paid }).eq("id", bill.id).eq("user_id", uid);
    }
  };

  // ── Goals ────────────────────────────────────────────────────────────────
  const setGoals = async (updater) => {
    const next = typeof updater === "function" ? updater(goals) : updater;
    setGoalsState(next);
    for (const goal of next) {
      await supabase.from("goals").update({
        current_amount: goal.current, paused: goal.paused,
      }).eq("id", goal.id).eq("user_id", uid);
    }
  };

  // ── Debts ────────────────────────────────────────────────────────────────
  const setDebts = async (updater) => {
    const next = typeof updater === "function" ? updater(debts) : updater;
    setDebtsState(next);
    for (const debt of next) {
      await supabase.from("debts").update({
        current_balance: debt.currentBalance,
      }).eq("id", debt.id).eq("user_id", uid);
    }
  };

  // ── Assets ───────────────────────────────────────────────────────────────
  const setAssets = async (updater) => {
    const next = typeof updater === "function" ? updater(assets) : updater;
    setAssetsState(next);
  };

  // ── Liabilities ──────────────────────────────────────────────────────────
  const setLiabilities = async (updater) => {
    const next = typeof updater === "function" ? updater(liabilities) : updater;
    setLiabilitiesState(next);
  };

  return {
    profile, loading,
    transactions, categories, bills, goals, debts, assets, liabilities, notifications,
    addTransaction, deleteTransaction, updateTransaction, setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding,
  };
}
