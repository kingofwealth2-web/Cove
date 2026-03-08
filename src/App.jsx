import { useState } from "react";
import { darkColors, lightColors, accentOptions } from "./tokens/colors";
import { springs } from "./tokens/springs";
import {
  INIT_CATEGORIES, INIT_TRANSACTIONS, INIT_BILLS,
  INIT_GOALS, INIT_DEBTS, INIT_ASSETS, INIT_LIABILITIES, INIT_NOTIFICATIONS,
} from "./data/initial";

import GlobalStyles from "./components/ui/GlobalStyles";
import Toast from "./components/ui/Toast";
import Sidebar from "./components/layout/Sidebar";

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
  const [onboarded, setOnboarded] = useState(false);
  const [user, setUser] = useState({ name: "Kwame", income: 4200, currency: "GHS" });
  const [theme, setTheme] = useState("dark");
  const [accentChoice, setAccentChoice] = useState(accentOptions[0]);
  const [active, setActive] = useState("home");
  const [showAdd, setShowAdd] = useState(false);
  const [transactions, setTransactions] = useState(INIT_TRANSACTIONS);
  const [categories, setCategories] = useState(INIT_CATEGORIES);
  const [bills, setBills] = useState(INIT_BILLS);
  const [goals, setGoals] = useState(INIT_GOALS);
  const [debts, setDebts] = useState(INIT_DEBTS);
  const [assets, setAssets] = useState(INIT_ASSETS);
  const [liabilities, setLiabilities] = useState(INIT_LIABILITIES);
  const [notifications, setNotifications] = useState(INIT_NOTIFICATIONS);
  const [toast, setToast] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const base = theme === "dark" ? darkColors : lightColors;
  const C = { ...base, accent: accentChoice.value, accentSoft: accentChoice.soft, accentGlow: accentChoice.glow };

  const navigate = (screen) => {
    setActive(screen);
    setAnimKey(k => k + 1);
  };

  const handleAddTransaction = (tx) => {
    setTransactions(ts => [tx, ...ts]);
    setToast("Transaction saved ✓");
  };

  const handleOnboardingComplete = ({ name, income, currency, accent, theme: t }) => {
    setUser({ name, income, currency });
    setAccentChoice(accent);
    setTheme(t);
    setOnboarded(true);
  };

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const screens = {
    home: <Dashboard transactions={transactions} categories={categories} user={user} C={C} onAdd={() => setShowAdd(true)} />,
    budget: <BudgetScreen transactions={transactions} categories={categories} setCategories={setCategories} user={user} C={C} />,
    trends: <TrendsScreen transactions={transactions} categories={categories} user={user} C={C} />,
    bills: <BillsScreen bills={bills} setBills={setBills} user={user} C={C} />,
    goals: <GoalsScreen goals={goals} setGoals={setGoals} user={user} C={C} />,
    debt: <DebtScreen debts={debts} setDebts={setDebts} user={user} C={C} />,
    networth: <NetWorthScreen assets={assets} setAssets={setAssets} liabilities={liabilities} setLiabilities={setLiabilities} user={user} C={C} />,
    notifications: <NotificationsScreen notifications={notifications} setNotifications={setNotifications} C={C} />,
    settings: <SettingsScreen user={user} setUser={setUser} C={C} setTheme={setTheme} theme={theme} accentChoice={accentChoice} setAccentChoice={setAccentChoice} />,
  };

  return (
    <>
      <GlobalStyles C={C} />
      <div style={{ display: "flex", minHeight: "100vh", background: C.background }}>
        <Sidebar active={active} setActive={navigate} onAdd={() => setShowAdd(true)} user={user} C={C} notifications={notifications} />
        <main key={animKey} style={{
          flex: 1, padding: "44px 52px", overflowY: "auto", maxHeight: "100vh",
          animation: `slideUp 280ms ${springs.bounce}`,
        }}>
          {screens[active] || screens.home}
        </main>
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
