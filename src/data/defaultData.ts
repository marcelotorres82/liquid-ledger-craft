import { FinancePayload } from "@/types/finance";

export const defaultFinanceData: FinancePayload = {
  incomeEntries: [
    { id: 1, title: "Salário", category: "Trabalho", amount: 6500, date: "05/02/2026", icon: "💼" },
    { id: 2, title: "Freelance Design", category: "Freelance", amount: 1200, date: "10/02/2026", icon: "🎨" },
    { id: 3, title: "Dividendos", category: "Investimentos", amount: 450, date: "15/02/2026", icon: "📈" },
    { id: 4, title: "Cashback", category: "Outros", amount: 300, date: "12/02/2026", icon: "💳" },
  ],
  expenseEntries: [
    { id: 101, title: "Aluguel", category: "Moradia", amount: 1800, date: "01/02/2026", icon: "🏠" },
    { id: 102, title: "Supermercado", category: "Alimentação", amount: 980.5, date: "08/02/2026", icon: "🛒" },
    { id: 103, title: "Streaming", category: "Entretenimento", amount: 89.9, date: "05/02/2026", icon: "📺" },
    { id: 104, title: "Uber/99", category: "Transporte", amount: 340, date: "14/02/2026", icon: "🚗" },
    { id: 105, title: "Academia", category: "Saúde", amount: 120, date: "01/02/2026", icon: "💪" },
    { id: 106, title: "Farmácia", category: "Saúde", amount: 210.1, date: "11/02/2026", icon: "💊" },
    { id: 107, title: "Internet", category: "Contas", amount: 130, date: "10/02/2026", icon: "📡" },
    { id: 108, title: "Restaurante", category: "Alimentação", amount: 560, date: "13/02/2026", icon: "🍽️" },
  ],
  savingsGoals: [
    { id: 1, name: "Viagem", emoji: "✈️", current: 2200, target: 6000, color: "savings" },
    { id: 2, name: "Reserva", emoji: "🛟", current: 5400, target: 10000, color: "income" },
    { id: 3, name: "Notebook", emoji: "💻", current: 1900, target: 4500, color: "expense" },
  ],
};
