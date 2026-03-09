import { useState, useEffect } from "react";
import { darkColors, lightColors, accentOptions } from "./tokens/colors";
import { springs } from "./tokens/springs";
import { supabase } from "./lib/supabase";
import { useSupabaseData } from "./hooks/useSupabaseData";

import GlobalStyles from "./components/ui/GlobalStyles";
import Toast from "./components/ui/Toast";
import Sidebar from "./components/layout/Sidebar";
import MobileTopBar from "./components/layout/MobileTopBar";

import AuthScreen from "./screens/AuthScreen";
import Onboarding from "./screens/Onboarding";
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
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    transactions, categories, bills, goals, debts, assets, liabilities, notifications,
    addTransaction, deleteTransaction, updateTransaction, setCategories, setBills, setGoals, setDebts, setAssets, setLiabilities,
    saveOnboarding, saveSettings,
  } = useSupabaseData(session);

  const base = theme === "dark" ? darkColors : lightColors;
  const C = { ...base, accent: accentChoice.value, accentSoft: accentChoice.soft, accentGlow: accentChoice.glow, accentDark: accentChoice.dark };

  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || "dark");
      const found = accentOptions.find(a => a.value === profile.accent_color);
      if (found) setAccentChoice(found);
    }
  }, [profile]);

  const navigate = (screen) => {
    setActive(screen);
    setAnimKey(k => k + 1);
  };

  const handleAddTransaction = async (tx) => {
    await addTransaction(tx);
    setToast("Transaction saved ✓");
  };

  const handleOnboardingComplete = async ({ name, income, currency, accent, theme: t }) => {
    setTheme(t);
    setAccentChoice(accent);
    await saveOnboarding({ name, income, currency, accent, theme: t });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const user = profile
    ? { name: profile.name, income: profile.monthly_income, currency: profile.currency }
    : { name: "User", income: 0, currency: "GHS" };

  const handleThemeChange = (t) => {
    setTheme(t);
    saveSettings({ theme: t });
  };

  const handleAccentChange = (a) => {
    setAccentChoice(a);
    saveSettings({ accentColor: a.value });
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
  if (!profile) return <Onboarding onComplete={handleOnboardingComplete} />;

  const screens = {
    home: <Dashboard transactions={transactions} categories={categories} user={user} C={C} onAdd={() => setShowAdd(true)} onDeleteTransaction={deleteTransaction} onUpdateTransaction={updateTransaction} />,
    budget: <BudgetScreen transactions={transactions} categories={categories} setCategories={setCategories} user={user} C={C} />,
    trends: <TrendsScreen transactions={transactions} categories={categories} user={user} C={C} />,
    bills: <BillsScreen bills={bills} setBills={setBills} user={user} C={C} />,
    goals: <GoalsScreen goals={goals} setGoals={setGoals} user={user} C={C} />,
    debt: <DebtScreen debts={debts} setDebts={setDebts} user={user} C={C} />,
    networth: <NetWorthScreen assets={assets} setAssets={setAssets} liabilities={liabilities} setLiabilities={setLiabilities} user={user} C={C} />,
    notifications: <NotificationsScreen notifications={notifications} setNotifications={() => {}} C={C} />,
    settings: <SettingsScreen user={user} setUser={setUser} C={C} setTheme={handleThemeChange} theme={theme} accentChoice={accentChoice} setAccentChoice={handleAccentChange} onSignOut={handleSignOut} />,
  };

  return (
    <>
      <GlobalStyles C={C} />
      <div style={{ display: "flex", minHeight: "100vh", background: C.background }}>
        <Sidebar
          active={active} setActive={navigate} onAdd={() => setShowAdd(true)}
          user={user} C={C} notifications={notifications}
          mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {isMobile && (
            <MobileTopBar
              onMenuOpen={() => setSidebarOpen(true)}
              onAdd={() => setShowAdd(true)}
              C={C}
              notifications={notifications}
            />
          )}
          <main key={animKey} style={{
            flex: 1,
            padding: isMobile ? "20px 16px" : "44px 52px",
            overflowY: "auto",
            maxHeight: isMobile ? "calc(100vh - 60px)" : "100vh",
            animation: `slideUp 280ms ${springs.bounce}`,
          }}>
            {screens[active] || screens.home}
          </main>
        </div>
      </div>
      {showAdd && (
        <AddTransactionPanel
          onClose={() => setShowAdd(false)}
          onSave={handleAddTransaction}
          categories={categories}
          user={user}
          C={C}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}