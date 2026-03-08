const today = new Date();

export const INIT_CATEGORIES = [
  { id: "c1", name: "Food", icon: "🍔", color: "#FF9F0A", budget: 800, group: "Living", rollover: false },
  { id: "c2", name: "Transport", icon: "🚗", color: "#5AC8FA", budget: 400, group: "Living", rollover: false },
  { id: "c3", name: "Rent", icon: "🏠", color: "#BF5AF2", budget: 1200, group: "Living", rollover: false },
  { id: "c4", name: "Utilities", icon: "💡", color: "#FF6B35", budget: 250, group: "Living", rollover: true },
  { id: "c5", name: "Health", icon: "❤️", color: "#FF375F", budget: 300, group: "Wellness", rollover: false },
  { id: "c6", name: "Fun", icon: "🎉", color: "#6366F1", budget: 350, group: "Lifestyle", rollover: false },
  { id: "c7", name: "Savings", icon: "💰", color: "#34C759", budget: 500, group: "Goals", rollover: false },
  { id: "c8", name: "Education", icon: "📚", color: "#00C7BE", budget: 200, group: "Growth", rollover: false },
];

export const INIT_TRANSACTIONS = [
  { id: "t1", categoryId: "c1", amount: 38, type: "expense", note: "Papaye", date: today.toISOString().split("T")[0], isRecurring: false },
  { id: "t2", categoryId: "c2", amount: 45, type: "expense", note: "Uber ride", date: today.toISOString().split("T")[0], isRecurring: false },
  { id: "t3", categoryId: "c1", amount: 210, type: "expense", note: "Shoprite", date: new Date(today - 86400000).toISOString().split("T")[0], isRecurring: false },
  { id: "t4", categoryId: "c5", amount: 120, type: "expense", note: "Pharmacy", date: new Date(today - 2*86400000).toISOString().split("T")[0], isRecurring: false },
  { id: "t5", categoryId: "c6", amount: 65, type: "expense", note: "Netflix", date: new Date(today - 3*86400000).toISOString().split("T")[0], isRecurring: true },
  { id: "t6", categoryId: "c3", amount: 1200, type: "expense", note: "Monthly rent", date: new Date(today - 7*86400000).toISOString().split("T")[0], isRecurring: true },
  { id: "t7", categoryId: "c7", amount: 500, type: "expense", note: "Savings transfer", date: new Date(today - 7*86400000).toISOString().split("T")[0], isRecurring: false },
  { id: "income1", categoryId: null, amount: 4200, type: "income", note: "Monthly salary", date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0], isRecurring: true },
];

export const INIT_BILLS = [
  { id: "b1", name: "Electricity", amount: 120, dueDay: 15, categoryId: "c4", isSubscription: false, paid: false },
  { id: "b2", name: "Netflix", amount: 65, dueDay: 5, categoryId: "c6", isSubscription: true, paid: true },
  { id: "b3", name: "Water Bill", amount: 80, dueDay: 20, categoryId: "c4", isSubscription: false, paid: false },
  { id: "b4", name: "Spotify", amount: 35, dueDay: 12, categoryId: "c6", isSubscription: true, paid: true },
  { id: "b5", name: "Internet", amount: 150, dueDay: 25, categoryId: "c4", isSubscription: false, paid: false },
];

export const INIT_GOALS = [
  { id: "g1", name: "Emergency Fund", icon: "🛡️", target: 5000, current: 2300, deadline: "2025-12-31", color: "#34C759", paused: false },
  { id: "g2", name: "New Laptop", icon: "💻", target: 3500, current: 800, deadline: "2025-08-01", color: "#6366F1", paused: false },
  { id: "g3", name: "Vacation", icon: "✈️", target: 8000, current: 6200, deadline: "2025-06-15", color: "#5AC8FA", paused: false },
];

export const INIT_DEBTS = [
  { id: "d1", lender: "Ecobank", originalAmount: 15000, currentBalance: 9200, interestRate: 18, minimumPayment: 450, dueDay: 10, type: "loan" },
  { id: "d2", lender: "Absa Credit Card", originalAmount: 5000, currentBalance: 1800, interestRate: 24, minimumPayment: 180, dueDay: 22, type: "credit_card" },
];

export const INIT_ASSETS = [
  { id: "a1", name: "Savings Account", type: "savings", value: 8500 },
  { id: "a2", name: "Mobile Money", type: "cash", value: 1200 },
  { id: "a3", name: "Car", type: "vehicle", value: 25000 },
];

export const INIT_LIABILITIES = [
  { id: "l1", name: "Ecobank Loan", type: "loan", balance: 9200 },
  { id: "l2", name: "Credit Card", type: "credit_card", balance: 1800 },
];

export const INIT_NOTIFICATIONS = [
  { id: "n1", type: "warning", title: "Fun budget at 84%", body: "You've used 84% of your Fun budget this month.", read: false, time: "2h ago" },
  { id: "n2", type: "bill", title: "Electricity due in 7 days", body: "Electricity bill of GHS 120 is due on the 15th.", read: false, time: "5h ago" },
  { id: "n3", type: "streak", title: "5-day streak! 🔥", body: "You've logged transactions 5 days in a row. Keep it up!", read: true, time: "1d ago" },
  { id: "n4", type: "recap", title: "February recap is ready", body: "You saved GHS 340 more than January. Great month!", read: true, time: "2d ago" },
];

export const TREND_DATA = [
  { month: "Oct", income: 4200, expenses: 3100 },
  { month: "Nov", income: 4200, expenses: 2800 },
  { month: "Dec", income: 5100, expenses: 4200 },
  { month: "Jan", income: 4200, expenses: 2600 },
  { month: "Feb", income: 4200, expenses: 3400 },
  { month: "Mar", income: 4200, expenses: 2180 },
];

export const NET_WORTH_HISTORY = [
  { month: "Oct", value: 11200 }, { month: "Nov", value: 12400 },
  { month: "Dec", value: 10800 }, { month: "Jan", value: 13200 },
  { month: "Feb", value: 14500 }, { month: "Mar", value: 23700 },
];
