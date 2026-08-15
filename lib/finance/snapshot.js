function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function categoryFromDescription(description, fallback = 'outros') {
  return String(description || '').match(/^\[cat:([^\]]+)]/i)?.[1] || fallback;
}

function monthKey(date) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthStart(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function monthsBetween(start, target) {
  return (target.getUTCFullYear() - start.getUTCFullYear()) * 12
    + target.getUTCMonth()
    - start.getUTCMonth();
}

function expenseValueForMonth(expense, targetMonth) {
  const startedAt = monthStart(expense.dataInicio.getUTCFullYear(), expense.dataInicio.getUTCMonth());
  const elapsed = monthsBetween(startedAt, targetMonth);
  if (elapsed < 0) return null;
  if (expense.tipo === 'fixa') return amount(expense.valorParcela);
  if (expense.tipo !== 'parcelada' || elapsed >= (Number(expense.parcelasTotal) || 1)) return null;
  if (elapsed === 0 && Number(expense.valorPrimeiraParcela) > 0) {
    return amount(expense.valorPrimeiraParcela);
  }
  return amount(expense.valorParcela);
}

export async function loadFinancialContext(prisma, userId, months = 12) {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1));
  const endExclusive = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1));
  const [receitas, despesas, orcamentos, metas] = await Promise.all([
    prisma.receita.findMany({
      where: { usuarioId: userId, dataRegistro: { gte: start, lt: endExclusive } },
      orderBy: { dataRegistro: 'desc' },
      take: 600,
    }),
    prisma.despesa.findMany({
      where: { usuarioId: userId, dataInicio: { lt: endExclusive } },
      orderBy: { dataInicio: 'desc' },
      take: 1000,
    }),
    prisma.orcamento?.findMany({ where: { usuarioId: userId, ativo: true } }).catch(() => []) || [],
    prisma.metaFinanceira?.findMany({ where: { usuarioId: userId, ativa: true } }).catch(() => []) || [],
  ]);

  const timeline = new Map();
  const categories = new Map();
  const transactions = [];
  const ensureMonth = (key) => {
    if (!timeline.has(key)) timeline.set(key, { month: key, income: 0, expenses: 0, balance: 0 });
    return timeline.get(key);
  };

  receitas.forEach((item) => {
    if (String(item.tipo).startsWith('caixinha_')) return;
    const value = amount(item.valor);
    const month = ensureMonth(monthKey(item.dataRegistro));
    month.income += value;
    month.balance += value;
    transactions.push({
      kind: 'income', description: item.descricao, amount: value,
      date: item.dataRegistro.toISOString().slice(0, 10), category: item.categoria || item.tipo,
      merchant: item.estabelecimento || '', account: item.conta || '',
    });
  });

  const addExpense = (item, value, date) => {
    const category = item.categoria || categoryFromDescription(item.descricao, item.tipo);
    const month = ensureMonth(monthKey(date));
    month.expenses += value;
    month.balance -= value;
    categories.set(category, amount((categories.get(category) || 0) + value));
    transactions.push({
      kind: 'expense', description: String(item.descricao).replace(/^\[cat:[^\]]+]\s*/i, ''),
      amount: value, date: date.toISOString().slice(0, 10), category,
      merchant: item.estabelecimento || '', account: item.conta || '', paid: item.paga,
    });
  };

  despesas.forEach((item) => {
    if (item.tipo === 'avulsa') {
      if (item.dataInicio >= start && item.dataInicio < endExclusive) {
        addExpense(item, amount(item.valorParcela), item.dataInicio);
      }
      return;
    }

    for (let offset = 0; offset < months; offset += 1) {
      const targetMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1));
      const value = expenseValueForMonth(item, targetMonth);
      if (value != null) addExpense(item, value, targetMonth);
    }
  });

  const monthly = [...timeline.values()]
    .map((item) => ({ ...item, income: amount(item.income), expenses: amount(item.expenses), balance: amount(item.balance) }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const totalIncome = amount(monthly.reduce((sum, item) => sum + item.income, 0));
  const totalExpenses = amount(monthly.reduce((sum, item) => sum + item.expenses, 0));

  return {
    periodMonths: months,
    totals: { income: totalIncome, expenses: totalExpenses, balance: amount(totalIncome - totalExpenses) },
    monthly,
    categories: [...categories.entries()]
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value),
    budgets: orcamentos.map((item) => ({
      id: item.id, category: item.categoria, limit: item.limiteCentavos / 100, month: item.mes, year: item.ano,
    })),
    goals: metas.map((item) => ({
      id: item.id, name: item.nome, target: item.valorAlvoCentavos / 100,
      current: item.valorAtualCentavos / 100, deadline: item.prazo?.toISOString().slice(0, 10) || null,
    })),
    recentTransactions: transactions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
  };
}
