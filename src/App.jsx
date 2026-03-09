import { useState, useEffect, useRef } from "react";
import { darkColors, lightColors, accentOptions } from "./tokens/colors";
import { springs } from "./tokens/springs";
import { supabase } from "./lib/supabase";
import { hashPin } from "./lib/pinUtils";
import { useSupabaseData } from "./hooks/useSupabaseData";

import GlobalStyles from "./components/ui/GlobalStyles";
import Toast from "./components/ui/Toast";
import Sidebar from "./components/layout/Sidebar";
import MobileTopBar from "./components/layout/MobileTopBar";

import AuthScreen from "./screens/AuthScreen";
import Onboarding from "./screens/Onboarding";
import PinScreen from "./screens/PinScreen";
import AddTransactionPanel from "./screens/AddTransactionPanel";
import Dashboard from "./screens/Dashboard";
import BudgetScreen from "./screens/BudgetScreen";
import TrendsScreen from "./screens/TrendsScreen";
import BillsScreen from "./screens/BillsScreen";
import GoalsScreen from "./screens/GoalsScreen";
import DebtScreen from "./screens/DebtScreen";
import NetWorthScreen from "./screens/NetWorthScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import SettingsScreen from "./screens/SettingsScreen";

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [accentChoice, setAccentChoice] = useState(accentOptions[0]);
  const [active, setActive] = useState("home");
  const animatedScreens = useRef(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pinLocked, setPinLocked] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    profile, loading,
    transactions, categories, bills, goals, debts, assets, liabilities,
    notifications, notifSettings, budgetMethod, pinHash,
    addTransaction, deleteTransaction, updateTransaction,
    setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding, saveSettings, deleteAllData, snapshots, saveNetworthSnapshot,
  } = useSupabaseData(session);

  // Re-lock when app comes back to foreground (PWA resume)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && pinHash) {
        setPinLocked(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pinHash]);

  const base = theme === "dark" ? darkColors : lightColors;
  const C = { ...base, accent: accentChoice.value, accentSoft: accentChoice.soft, accentGlow: accentChoice.glow, accentDark: accentChoice.dark };

  // Sync profile settings on load
  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || "dark");
      const found = accentOptions.find(a => a.value === profile.accent_color);
      if (found) setAccentChoice(found);
      // Show PIN lock screen on first load if PIN is set
      if (profile.pin_hash) setPinLocked(true);
    }
  }, [profile?.id]);

  // ── Recurring transaction auto-log ──────────────────────────────────────
  useEffect(() => {
    if (!profile || !transactions.length) return;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    if (profile.last_recurring_log === thisMonth) return;

    const recurring = transactions.filter(t => t.isRecurring);
    if (!recurring.length) return;

    const seen = new Set();
    const templates = recurring.filter(t => {
      const key = `${t.categoryId}-${t.note}-${t.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const thisMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const toLog = templates.filter(t =>
      !thisMonthTxs.some(m => m.categoryId === t.categoryId && m.note === t.note && m.isRecurring)
    );

    if (!toLog.length) return;

    const today = now.toISOString().split("T")[0];
    Promise.all(toLog.map(t => addTransaction({ ...t, date: today, id: undefined }))).then(() => {
      supabase.from("profiles").update({ last_recurring_log: thisMonth }).eq("id", profile.id);
      setToast(`${toLog.length} recurring transaction${toLog.length > 1 ? "s" : ""} logged ✓`);
    });
  }, [profile?.id, transactions.length]);

  const navigate = (screen) => {
    if (screen !== active) {
      animatedScreens.current.delete(screen);
      setActive(screen);
    }
  };

  const handleAddTransaction = async (tx) => {
    await addTransaction(tx);
    setToast("Transaction saved ✓");
  };

  const handleOnboardingComplete = async ({ name, incomeTypes, currency, accent, theme: t }) => {
    setTheme(t);
    setAccentChoice(accent);
    await saveOnboarding({ name, incomeTypes, currency, accent, theme: t });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPinLocked(false);
  };

  const handleDeleteAllData = async () => {
    await deleteAllData();
    setToast("All data deleted");
    navigate("home");
  };

  const user = profile
    ? { name: profile.name, income: profile.monthly_income, currency: profile.currency }
    : { name: "User", income: 0, currency: "GHS" };

  const handleThemeChange = (t) => { setTheme(t); saveSettings({ theme: t }); };
  const handleAccentChange = (a) => { setAccentChoice(a); saveSettings({ accentColor: a.value }); };
  const handleBudgetMethodChange = (m) => { saveSettings({ budgetMethod: m }); };
  const handleNotifSettingsChange = (ns) => { saveSettings({ notifSettings: ns }); };
  const handleSetPin = async (pin) => {
    if (pin) {
      const hashed = await hashPin(pin);
      await saveSettings({ pinHash: hashed });
      setPinLocked(true);
    } else {
      await saveSettings({ pinHash: null });
    }
  };

  const setUser = async (updater) => {
    const next = typeof updater === "function" ? updater(user) : updater;
    await saveSettings({ name: next.name, currency: next.currency, income: next.income });
  };

  if (authLoading || (session && loading)) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366F1", animation: "spin 700ms linear infinite" }} />
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  if (!profile && !loading) return <Onboarding onComplete={handleOnboardingComplete} />;

  if (pinLocked && pinHash) {
    return <PinScreen pinHash={pinHash} onUnlock={() => setPinLocked(false)} C={C} />;
  }

  const getScreenAnimation = (id) => {
    if (id === active && !animatedScreens.current.has(id)) {
      animatedScreens.current.add(id);
      return `slideUp 280ms ${springs.bounce}`;
    }
    return "none";
  };

  const SCREENS = [
    { id: "home",          el: <Dashboard transactions={transactions} categories={categories} user={user} C={C} onAdd={() => setShowAdd(true)} onDeleteTransaction={deleteTransaction} onUpdateTransaction={updateTransaction} /> },
    { id: "budget",        el: <BudgetScreen transactions={transactions} categories={categories} setCategories={setCategories} user={user} C={C} budgetMethod={budgetMethod} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} /> },
    { id: "trends",        el: <TrendsScreen transactions={transactions} categories={categories} user={user} C={C} /> },
    { id: "bills",         el: <BillsScreen bills={bills} setBills={setBills} user={user} C={C} /> },
    { id: "goals",         el: <GoalsScreen goals={goals} setGoals={setGoals} user={user} C={C} /> },
    { id: "debt",          el: <DebtScreen debts={debts} setDebts={setDebts} user={user} C={C} /> },
    { id: "networth",      el: <NetWorthScreen assets={assets} setAssets={setAssets} liabilities={liabilities} setLiabilities={setLiabilities} user={user} C={C} snapshots={snapshots} saveNetworthSnapshot={saveNetworthSnapshot} /> },
    { id: "notifications", el: <NotificationsScreen notifications={notifications} setNotifications={() => {}} C={C} /> },
    { id: "settings",      el: <SettingsScreen user={user} setUser={setUser} C={C} session={session} setTheme={handleThemeChange} theme={theme} accentChoice={accentChoice} setAccentChoice={handleAccentChange} onSignOut={handleSignOut} transactions={transactions} categories={categories} onDeleteAllData={handleDeleteAllData} budgetMethod={budgetMethod} onBudgetMethodChange={handleBudgetMethodChange} notifSettings={notifSettings} onNotifSettingsChange={handleNotifSettingsChange} pinHash={pinHash} onSetPin={handleSetPin} /> },
  ];

  return (
    <>
      <GlobalStyles C={C} />
      <div style={{ display: "flex", minHeight: "100vh", background: C.background }}>
        <Sidebar active={active} setActive={navigate} onAdd={() => setShowAdd(true)} user={user} C={C} notifications={notifications} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} onSignOut={handleSignOut} theme={theme} onThemeToggle={() => handleThemeChange(theme === "dark" ? "light" : "dark")} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {isMobile && <MobileTopBar onMenuOpen={() => setSidebarOpen(true)} onAdd={() => setShowAdd(true)} C={C} notifications={notifications} theme={theme} onThemeToggle={() => handleThemeChange(theme === "dark" ? "light" : "dark")} />}
          <main style={{ flex: 1, position: "relative", maxHeight: isMobile ? "calc(100vh - 60px)" : "100vh" }}>
            {SCREENS.map(({ id, el }) => (
              <div key={id} style={{
                display: active === id ? "block" : "none",
                position: "absolute", inset: 0, overflowY: "auto",
                padding: isMobile ? "20px 16px" : "44px 52px",
                animation: getScreenAnimation(id),
              }}>
                {el}
              </div>
            ))}
          </main>
        </div>
      </div>
      {showAdd && <AddTransactionPanel onClose={() => setShowAdd(false)} onSave={handleAddTransaction} categories={categories} user={user} C={C} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}