import { create } from "zustand";

export interface Transaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
}

interface FinanceStore {
  incomeEntries: Transaction[];
  expenseEntries: Transaction[];
  nextId: number;
  addIncome: (t: Omit<Transaction, "id">) => void;
  updateIncome: (id: number, t: Partial<Transaction>) => void;
  deleteIncome: (id: number) => void;
  addExpense: (t: Omit<Transaction, "id">) => void;
  updateExpense: (id: number, t: Partial<Transaction>) => void;
  deleteExpense: (id: number) => void;
}

const defaultIncome: Transaction[] = [
  { id: 1, title: "Salário", category: "Trabalho", amount: 6500, date: "05/02/2026", icon: "💼" },
  { id: 2, title: "Freelance Design", category: "Freelance", amount: 1200, date: "10/02/2026", icon: "🎨" },
  { id: 3, title: "Dividendos", category: "Investimentos", amount: 450, date: "15/02/2026", icon: "📈" },
  { id: 4, title: "Cashback", category: "Outros", amount: 300, date: "12/02/2026", icon: "💳" },
];

const defaultExpenses: Transaction[] = [
  { id: 101, title: "Aluguel", category: "Moradia", amount: 1800, date: "01/02/2026", icon: "🏠" },
  { id: 102, title: "Supermercado", category: "Alimentação", amount: 980.50, date: "08/02/2026", icon: "🛒" },
  { id: 103, title: "Streaming", category: "Entretenimento", amount: 89.90, date: "05/02/2026", icon: "📺" },
  { id: 104, title: "Uber/99", category: "Transporte", amount: 340, date: "14/02/2026", icon: "🚗" },
  { id: 105, title: "Academia", category: "Saúde", amount: 120, date: "01/02/2026", icon: "💪" },
  { id: 106, title: "Farmácia", category: "Saúde", amount: 210.10, date: "11/02/2026", icon: "💊" },
  { id: 107, title: "Internet", category: "Contas", amount: 130, date: "10/02/2026", icon: "📡" },
  { id: 108, title: "Restaurante", category: "Alimentação", amount: 560, date: "13/02/2026", icon: "🍽️" },
];

export const useFinanceStore = create<FinanceStore>((set) => ({
  incomeEntries: defaultIncome,
  expenseEntries: defaultExpenses,
  nextId: 200,
  addIncome: (t) =>
    set((s) => ({ incomeEntries: [...s.incomeEntries, { ...t, id: s.nextId }], nextId: s.nextId + 1 })),
  updateIncome: (id, t) =>
    set((s) => ({ incomeEntries: s.incomeEntries.map((e) => (e.id === id ? { ...e, ...t } : e)) })),
  deleteIncome: (id) =>
    set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) })),
  addExpense: (t) =>
    set((s) => ({ expenseEntries: [...s.expenseEntries, { ...t, id: s.nextId }], nextId: s.nextId + 1 })),
  updateExpense: (id, t) =>
    set((s) => ({ expenseEntries: s.expenseEntries.map((e) => (e.id === id ? { ...e, ...t } : e)) })),
  deleteExpense: (id) =>
    set((s) => ({ expenseEntries: s.expenseEntries.filter((e) => e.id !== id) })),
}));
