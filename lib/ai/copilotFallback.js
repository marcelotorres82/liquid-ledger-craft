const NUMBER_WORDS = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export function parseRequestedPeriodMonths(question, fallback = 12) {
  const text = normalize(question);
  if (/\b(?:ultimo|ultimos)\s+trimestre\b/.test(text)) return 3;
  if (/\b(?:ultimo|ultimos)\s+semestre\b/.test(text)) return 6;
  if (/\b(?:ultimo|ultimos)\s+ano\b/.test(text)) return 12;

  const match = text.match(/\b(?:ultimo|ultimos|ultimas)\s+(\d{1,2}|[a-z]+)\s+mes(?:es)?\b/);
  if (!match) return fallback;
  const parsed = /^\d+$/.test(match[1]) ? Number(match[1]) : NUMBER_WORDS[match[1]];
  return Number.isInteger(parsed) ? Math.min(24, Math.max(1, parsed)) : fallback;
}

export function buildLocalCopilotAnswer(question, context) {
  const months = Math.max(1, Number(context.periodMonths) || 12);
  const categories = Array.isArray(context.categories) ? context.categories.slice(0, 3) : [];
  const top = categories[0];
  const normalizedQuestion = normalize(question);
  const asksToSave = /economiz|poupar|reduz|cortar|gastar menos|diminuir/.test(normalizedQuestion);

  if (asksToSave && top) {
    const monthlyAverage = top.value / months;
    const savingTarget = monthlyAverage * 0.1;
    return {
      headline: `Maior oportunidade: ${top.category}`,
      severity: 'info',
      answer: `Com base nos últimos ${months} meses, sua maior despesa foi ${top.category}: ${money(top.value)} no período, ou ${money(monthlyAverage)} por mês. Uma redução inicial de 10% nessa categoria economizaria cerca de ${money(savingTarget)} por mês.`,
      evidence: categories.map((item) => `${item.category}: ${money(item.value)} em ${months} meses`),
      suggestions: [
        `Revise os lançamentos de ${top.category} e procure cobranças recorrentes ou compras evitáveis.`,
        `Defina um limite mensal próximo de ${money(Math.max(0, monthlyAverage - savingTarget))} para essa categoria.`,
      ],
      action: {
        type: 'navigate',
        label: 'Ver análise de despesas',
        category: top.category,
        amount: 0,
        path: '/analytics',
        requiresConfirmation: false,
      },
    };
  }

  const average = context.totals.expenses / months;
  return {
    headline: `Resumo dos últimos ${months} meses`,
    severity: context.totals.balance >= 0 ? 'success' : 'warning',
    answer: `No período solicitado, seu saldo acumulado foi ${money(context.totals.balance)} e a média mensal de despesas foi ${money(average)}.`,
    evidence: top
      ? [`Maior categoria: ${top.category}, com ${money(top.value)} no período.`]
      : ['Ainda há poucos lançamentos para comparar.'],
    suggestions: ['Mantenha os lançamentos categorizados para obter recomendações mais precisas.'],
    action: { type: 'none', label: '', category: '', amount: 0, path: '', requiresConfirmation: false },
  };
}
