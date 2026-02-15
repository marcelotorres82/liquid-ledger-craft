export interface Transaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  emoji: string;
  current: number;
  target: number;
  color: "income" | "expense" | "savings";
}

export interface FinancePayload {
  incomeEntries: Transaction[];
  expenseEntries: Transaction[];
  savingsGoals: SavingsGoal[];
}
