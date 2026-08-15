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

export async function loadFinancialContext(prisma, userId, months = 12) {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1));
  const [receitas, despesas, orcamentos, metas] = await Promise.all([
    prisma.receita.findMany({
      where: { usuarioId: userId, dataRegistro: { gte: start } },
      orderBy: { dataRegistro: 'desc' },
      take: 600,
    }),
    prisma.despesa.findMany({
      where: { usuarioId: userId, dataInicio: { gte: start } },
      orderBy: { dataInicio: 'desc' },
      take: 600,
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

  despesas.forEach((item) => {
    const value = amount(item.valorParcela);
    const month = ensureMonth(monthKey(item.dataInicio));
    month.expenses += value;
    month.balance -= value;
    const category = item.categoria || categoryFromDescription(item.descricao, item.tipo);
    categories.set(category, amount((categories.get(category) || 0) + value));
    transactions.push({
      kind: 'expense', description: String(item.descricao).replace(/^\[cat:[^\]]+]\s*/i, ''),
      amount: value, date: item.dataInicio.toISOString().slice(0, 10), category,
      merchant: item.estabelecimento || '', account: item.conta || '', paid: item.paga,
    });
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
