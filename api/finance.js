import fs from "node:fs";
import path from "node:path";

const STORAGE_FILE = path.join("/tmp", "liquid-ledger-finance.json");

const defaultFinanceData = {
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

const buildState = (data) => {
  const allIds = [
    ...data.incomeEntries.map((item) => item.id),
    ...data.expenseEntries.map((item) => item.id),
    ...data.savingsGoals.map((item) => item.id),
  ];

  return {
    ...data,
    nextId: Math.max(...allIds, 0) + 1,
  };
};

const readData = () => {
  if (!fs.existsSync(STORAGE_FILE)) {
    return buildState(defaultFinanceData);
  }

  const raw = fs.readFileSync(STORAGE_FILE, "utf8");
  return buildState(JSON.parse(raw));
};

const saveData = (state) => {
  const payload = {
    incomeEntries: state.incomeEntries,
    expenseEntries: state.expenseEntries,
    savingsGoals: state.savingsGoals,
  };
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(payload), "utf8");
};

export default function handler(req, res) {
  const state = readData();

  if (req.method === "GET") {
    return res.status(200).json(state);
  }

  if (req.method === "POST") {
    const { type, transaction, goal } = req.body || {};

    if (type === "income" || type === "expense") {
      const key = type === "income" ? "incomeEntries" : "expenseEntries";
      state[key].push({ ...transaction, id: state.nextId });
      saveData(state);
      return res.status(201).json(buildState(state));
    }

    if (type === "goal") {
      state.savingsGoals.push({ ...goal, id: state.nextId });
      saveData(state);
      return res.status(201).json(buildState(state));
    }

    return res.status(400).json({ error: "Tipo inválido para criação." });
  }

  if (req.method === "PATCH") {
    const { type, id, transaction } = req.body || {};
    const targetId = Number(id);

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Tipo inválido para atualização." });
    }

    const key = type === "income" ? "incomeEntries" : "expenseEntries";
    state[key] = state[key].map((entry) =>
      entry.id === targetId ? { ...entry, ...transaction } : entry,
    );

    saveData(state);
    return res.status(200).json(buildState(state));
  }

  if (req.method === "DELETE") {
    const { type, id } = req.query;
    const targetId = Number(id);

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Tipo inválido para remoção." });
    }

    const key = type === "income" ? "incomeEntries" : "expenseEntries";
    state[key] = state[key].filter((entry) => entry.id !== targetId);

    saveData(state);
    return res.status(200).json(buildState(state));
  }

  return res.status(405).json({ error: "Método não permitido." });
}
