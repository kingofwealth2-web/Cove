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

  // ── Onboarding: save profile + seed data ────────────────────────────────
  const saveOnboarding = async ({ name, income, currency, accent, theme }) => {
    // Save profile
    await supabase.from("profiles").upsert({
      id: uid, name, currency,
      accent_color: accent.value,
      theme,
      monthly_income: income,
    });

    // Seed categories
    const cats = INIT_CATEGORIES.map((c, i) => ({
      user_id: uid, name: c.name, icon: c.icon, color: c.color,
      budget_amount: c.budget, group_name: c.group, rollover: c.rollover, sort_order: i,
    }));
    const { data: insertedCats } = await supabase.from("categories").insert(cats).select();

    // Build categoryId map old→new
    const catMap = {};
    INIT_CATEGORIES.forEach((c, i) => { catMap[c.id] = insertedCats[i].id; });

    // Seed transactions
    const txs = INIT_TRANSACTIONS.map(t => ({
      user_id: uid, category_id: t.categoryId ? catMap[t.categoryId] : null,
      amount: t.amount, type: t.type, note: t.note, date: t.date, is_recurring: t.isRecurring,
    }));
    await supabase.from("transactions").insert(txs);

    // Seed bills
    const bls = INIT_BILLS.map(b => ({
      user_id: uid, name: b.name, amount: b.amount, due_day: b.dueDay,
      category_id: catMap[b.categoryId] || null, is_subscription: b.isSubscription, paid: b.paid,
    }));
    await supabase.from("bills").insert(bls);

    // Seed goals
    const gls = INIT_GOALS.map(g => ({
      user_id: uid, name: g.name, icon: g.icon, target_amount: g.target,
      current_amount: g.current, deadline: g.deadline, color: g.color, paused: g.paused,
    }));
    await supabase.from("goals").insert(gls);

    // Seed debts
    const dbs = INIT_DEBTS.map(d => ({
      user_id: uid, lender: d.lender, original_amount: d.originalAmount,
      current_balance: d.currentBalance, interest_rate: d.interestRate,
      minimum_payment: d.minimumPayment, due_day: d.dueDay, type: d.type,
    }));
    await supabase.from("debts").insert(dbs);

    // Seed assets
    const ast = INIT_ASSETS.map(a => ({ user_id: uid, name: a.name, type: a.type, value: a.value }));
    await supabase.from("assets").insert(ast);

    // Seed liabilities
    const lib = INIT_LIABILITIES.map(l => ({ user_id: uid, name: l.name, type: l.type, balance: l.balance }));
    await supabase.from("liabilities").insert(lib);

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
    addTransaction, setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding,
  };
}