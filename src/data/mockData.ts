export const monthlyData = {
  month: "Fevereiro 2026",
  totalIncome: 8450.00,
  totalExpenses: 5230.50,
  balance: 3219.50,
};

export const incomeEntries = [
  { id: 1, title: "Salário", category: "Trabalho", amount: 6500, date: "05/02/2026", icon: "💼" },
  { id: 2, title: "Freelance Design", category: "Freelance", amount: 1200, date: "10/02/2026", icon: "🎨" },
  { id: 3, title: "Dividendos", category: "Investimentos", amount: 450, date: "15/02/2026", icon: "📈" },
  { id: 4, title: "Cashback", category: "Outros", amount: 300, date: "12/02/2026", icon: "💳" },
];

export const expenseEntries = [
  { id: 1, title: "Aluguel", category: "Moradia", amount: 1800, date: "01/02/2026", icon: "🏠" },
  { id: 2, title: "Supermercado", category: "Alimentação", amount: 980.50, date: "08/02/2026", icon: "🛒" },
  { id: 3, title: "Streaming", category: "Entretenimento", amount: 89.90, date: "05/02/2026", icon: "📺" },
  { id: 4, title: "Uber/99", category: "Transporte", amount: 340, date: "14/02/2026", icon: "🚗" },
  { id: 5, title: "Academia", category: "Saúde", amount: 120, date: "01/02/2026", icon: "💪" },
  { id: 6, title: "Farmácia", category: "Saúde", amount: 210.10, date: "11/02/2026", icon: "💊" },
  { id: 7, title: "Internet", category: "Contas", amount: 130, date: "10/02/2026", icon: "📡" },
  { id: 8, title: "Restaurante", category: "Alimentação", amount: 560, date: "13/02/2026", icon: "🍽️" },
];

export const savingsGoals = [
  { id: 1, name: "Viagem Japão", emoji: "✈️", current: 8500, target: 15000, color: "savings" as const },
  { id: 2, name: "MacBook Pro", emoji: "💻", current: 6200, target: 9000, color: "income" as const },
  { id: 3, name: "Reserva de Emergência", emoji: "🛡️", current: 12000, target: 20000, color: "expense" as const },
  { id: 4, name: "Carro Novo", emoji: "🚘", current: 15000, target: 60000, color: "savings" as const },
];

export const categoryBreakdown = [
  { name: "Moradia", value: 1800, color: "#3B82F6", pct: 34.4 },
  { name: "Alimentação", value: 1540.50, color: "#F59E0B", pct: 29.5 },
  { name: "Transporte", value: 340, color: "#8B5CF6", pct: 6.5 },
  { name: "Saúde", value: 330.10, color: "#10B981", pct: 6.3 },
  { name: "Contas", value: 130, color: "#6366F1", pct: 2.5 },
  { name: "Entretenimento", value: 89.90, color: "#EC4899", pct: 1.7 },
];

export const monthlyTrend = [
  { month: "Set", income: 7200, expenses: 4800 },
  { month: "Out", income: 7800, expenses: 5100 },
  { month: "Nov", income: 8100, expenses: 4900 },
  { month: "Dez", income: 9200, expenses: 6800 },
  { month: "Jan", income: 7900, expenses: 5400 },
  { month: "Fev", income: 8450, expenses: 5230 },
];
