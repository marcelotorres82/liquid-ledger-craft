import { create } from "zustand";
import { defaultFinanceData } from "@/data/defaultData";
import { FinancePayload, SavingsGoal, Transaction } from "@/types/finance";

interface FinanceStore extends FinancePayload {
  nextId: number;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  addIncome: (t: Omit<Transaction, "id">) => Promise<void>;
  updateIncome: (id: number, t: Partial<Transaction>) => Promise<void>;
  deleteIncome: (id: number) => Promise<void>;
  addExpense: (t: Omit<Transaction, "id">) => Promise<void>;
  updateExpense: (id: number, t: Partial<Transaction>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => Promise<void>;
}

const maxDefaultId = Math.max(
  ...defaultFinanceData.incomeEntries.map((i) => i.id),
  ...defaultFinanceData.expenseEntries.map((e) => e.id),
  ...defaultFinanceData.savingsGoals.map((g) => g.id),
);

const request = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  ...defaultFinanceData,
  nextId: maxDefaultId + 1,
  loading: false,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const data = await request("/api/finance");
      set({
        incomeEntries: data.incomeEntries,
        expenseEntries: data.expenseEntries,
        savingsGoals: data.savingsGoals,
        nextId: data.nextId,
      });
    } catch {
      set({ error: "API indisponível no momento. Usando modo local." });
    } finally {
      set({ loading: false });
    }
  },

  addIncome: async (t) => {
    const localId = get().nextId;
    const localRecord = { ...t, id: localId };
    set((s) => ({ incomeEntries: [...s.incomeEntries, localRecord], nextId: s.nextId + 1 }));

    try {
      const data = await request("/api/finance", { method: "POST", body: JSON.stringify({ type: "income", transaction: t }) });
      set({ incomeEntries: data.incomeEntries, nextId: data.nextId });
    } catch {
      set({ error: "Não foi possível sincronizar receita com o backend." });
    }
  },

  updateIncome: async (id, t) => {
    set((s) => ({ incomeEntries: s.incomeEntries.map((e) => (e.id === id ? { ...e, ...t } : e)) }));
    try {
      const data = await request("/api/finance", { method: "PATCH", body: JSON.stringify({ type: "income", id, transaction: t }) });
      set({ incomeEntries: data.incomeEntries });
    } catch {
      set({ error: "Não foi possível atualizar receita no backend." });
    }
  },

  deleteIncome: async (id) => {
    set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) }));
    try {
      const data = await request(`/api/finance?type=income&id=${id}`, { method: "DELETE" });
      set({ incomeEntries: data.incomeEntries });
    } catch {
      set({ error: "Não foi possível remover receita no backend." });
    }
  },

  addExpense: async (t) => {
    const localId = get().nextId;
    const localRecord = { ...t, id: localId };
    set((s) => ({ expenseEntries: [...s.expenseEntries, localRecord], nextId: s.nextId + 1 }));

    try {
      const data = await request("/api/finance", { method: "POST", body: JSON.stringify({ type: "expense", transaction: t }) });
      set({ expenseEntries: data.expenseEntries, nextId: data.nextId });
    } catch {
      set({ error: "Não foi possível sincronizar despesa com o backend." });
    }
  },

  updateExpense: async (id, t) => {
    set((s) => ({ expenseEntries: s.expenseEntries.map((e) => (e.id === id ? { ...e, ...t } : e)) }));
    try {
      const data = await request("/api/finance", { method: "PATCH", body: JSON.stringify({ type: "expense", id, transaction: t }) });
      set({ expenseEntries: data.expenseEntries });
    } catch {
      set({ error: "Não foi possível atualizar despesa no backend." });
    }
  },

  deleteExpense: async (id) => {
    set((s) => ({ expenseEntries: s.expenseEntries.filter((e) => e.id !== id) }));
    try {
      const data = await request(`/api/finance?type=expense&id=${id}`, { method: "DELETE" });
      set({ expenseEntries: data.expenseEntries });
    } catch {
      set({ error: "Não foi possível remover despesa no backend." });
    }
  },

  addSavingsGoal: async (goal) => {
    const localId = get().nextId;
    const localGoal = { ...goal, id: localId };
    set((s) => ({ savingsGoals: [...s.savingsGoals, localGoal], nextId: s.nextId + 1 }));

    try {
      const data = await request("/api/finance", { method: "POST", body: JSON.stringify({ type: "goal", goal }) });
      set({ savingsGoals: data.savingsGoals, nextId: data.nextId });
    } catch {
      set({ error: "Não foi possível sincronizar meta com o backend." });
    }
  },
}));

export type { Transaction, SavingsGoal };
