const TIME_ZONE = 'America/Sao_Paulo';

const EXPENSE_CATEGORIES = [
  {
    key: 'alimentacao',
    label: 'Alimentação',
    keywords: ['mercado', 'supermercado', 'comida', 'almoco', 'jantar', 'restaurante', 'pizza', 'lanche', 'cafe', 'padaria', 'ifood'],
  },
  {
    key: 'transporte',
    label: 'Transporte',
    keywords: ['uber', 'taxi', '99', 'gasolina', 'combustivel', 'estacionamento', 'onibus', 'metro', 'carro', 'pedagio'],
  },
  {
    key: 'contas_fixas',
    label: 'Contas fixas',
    keywords: ['aluguel', 'condominio', 'prestacao', 'financiamento', 'seguro', 'mensalidade'],
  },
  {
    key: 'contas_variaveis',
    label: 'Contas variáveis',
    keywords: ['luz', 'energia', 'agua', 'internet', 'telefone', 'celular', 'vivo', 'claro', 'tim', 'cartao'],
  },
  {
    key: 'saude',
    label: 'Saúde',
    keywords: ['farmacia', 'remedio', 'medico', 'consulta', 'hospital', 'dentista', 'academia', 'gympass'],
  },
  {
    key: 'educacao',
    label: 'Educação',
    keywords: ['escola', 'faculdade', 'curso', 'livro', 'material escolar', 'mensalidade escolar'],
  },
  {
    key: 'impostos',
    label: 'Impostos',
    keywords: ['imposto', 'ipva', 'iptu', 'taxa', 'multa'],
  },
  {
    key: 'assinaturas',
    label: 'Assinaturas',
    keywords: ['netflix', 'spotify', 'assinatura', 'streaming', 'youtube', 'prime'],
  },
  {
    key: 'entretenimento',
    label: 'Entretenimento',
    keywords: ['cinema', 'show', 'jogo', 'viagem', 'passeio', 'festa', 'lazer'],
  },
  {
    key: 'compras',
    label: 'Compras',
    keywords: ['comprei', 'compra', 'roupa', 'sapato', 'presente', 'shopping', 'loja'],
  },
];

const INCOME_CATEGORIES = [
  { key: 'salario', label: 'Salário', keywords: ['salario', 'pagamento', 'pro labore'] },
  { key: 'freelance', label: 'Freelance', keywords: ['freelance', 'freela', 'projeto', 'servico'] },
  { key: 'investimentos', label: 'Investimentos', keywords: ['dividendo', 'rendimento', 'investimento', 'juros'] },
  { key: 'vendas', label: 'Vendas', keywords: ['venda', 'vendi', 'reembolso', 'cashback'] },
  { key: 'beneficios', label: 'Benefícios', keywords: ['beneficio', 'bonus', 'premio', 'comissao'] },
];

const INCOME_WORDS = [
  'recebi',
  'receita',
  'ganhei',
  'entrou',
  'entrada',
  'deposito',
  'depositaram',
  'pix recebido',
  'salario',
  'rendimento',
  'vendi',
];

const EXPENSE_WORDS = [
  'gastei',
  'gasto',
  'despesa',
  'paguei',
  'pagamento',
  'comprei',
  'compra',
  'saiu',
  'debito',
  'debitou',
  'pix enviado',
];

const TRANSACTION_WORDS_REGEX =
  /\b(gastei|gasto|despesa|paguei|pagamento|comprei|compra|saiu|debito|debitou|recebi|receita|ganhei|entrou|entrada|deposito|depositaram|vendi|pix\s+(?:enviado|recebido))\b/giu;

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getZonedDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function toISODate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shiftISODate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseTransactionDate(text, now = new Date()) {
  const todayParts = getZonedDateParts(now);
  const today = toISODate(todayParts.year, todayParts.month, todayParts.day);
  const explicitDate = /\b(?:dia\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/i.exec(text);

  if (explicitDate) {
    let year = explicitDate[3] ? Number(explicitDate[3]) : todayParts.year;
    if (year < 100) year += 2000;
    const date = toISODate(year, Number(explicitDate[2]), Number(explicitDate[1]));
    if (!date) return { error: 'Data inválida. Use o formato dia/mês, por exemplo 05/08.' };
    return {
      date,
      text: `${text.slice(0, explicitDate.index)} ${text.slice(explicitDate.index + explicitDate[0].length)}`,
    };
  }

  if (/\bontem\b/i.test(normalizeText(text))) {
    return { date: shiftISODate(today, -1), text: text.replace(/\bontem\b/giu, ' ') };
  }

  return { date: today, text: text.replace(/\bhoje\b/giu, ' ') };
}

function parseCurrencyNumber(rawValue) {
  let value = String(rawValue || '')
    .replace(/r\$/gi, '')
    .replace(/\s/g, '')
    .trim();

  if (value.includes(',') && value.includes('.')) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if ((value.match(/\./g) || []).length > 1) {
    value = value.replace(/\./g, '');
  } else if (/^\d{1,3}\.\d{3}$/.test(value)) {
    value = value.replace('.', '');
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}

function extractAmount(text) {
  const currencyMatch = /r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i.exec(text);
  const genericMatch = /\b\d+(?:[.,]\d{1,2})?\b/.exec(text);
  const match = currencyMatch || genericMatch;

  if (!match) return null;

  const rawNumber = currencyMatch ? match[1] : match[0];
  const value = parseCurrencyNumber(rawNumber);
  if (value == null) return null;

  return {
    value,
    text: `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`,
  };
}

function detectKind(normalizedText) {
  if (INCOME_WORDS.some((word) => normalizedText.includes(word))) return 'income';
  if (EXPENSE_WORDS.some((word) => normalizedText.includes(word))) return 'expense';
  return 'expense';
}

function detectCategory(kind, normalizedText) {
  const categories = kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const matched = categories.find((category) =>
    category.keywords.some((keyword) => normalizedText.includes(keyword))
  );

  if (matched) return { key: matched.key, label: matched.label };
  return kind === 'income'
    ? { key: 'outras_receitas', label: 'Outras receitas' }
    : { key: 'compras', label: 'Compras' };
}

function detectRecordType(kind, normalizedText) {
  if (kind === 'income') {
    return /\b(salario|fixa|fixo|mensal|todo mes)\b/.test(normalizedText) ? 'fixa' : 'variavel';
  }

  return /\b(fixa|fixo|mensal|todo mes|recorrente)\b/.test(normalizedText) ? 'fixa' : 'avulsa';
}

function cleanDescription(text, categoryLabel) {
  let description = text
    .replace(TRANSACTION_WORDS_REGEX, ' ')
    .replace(/\b(r\$|reais?|real|hoje|ontem)\b/giu, ' ')
    .replace(/[,:;|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  while (/^(no|na|em|com|do|da|de|para|por)\s+/i.test(description)) {
    description = description.replace(/^(no|na|em|com|do|da|de|para|por)\s+/i, '').trim();
  }

  while (/\s+(no|na|em|com|do|da|de|para|por)$/i.test(description)) {
    description = description.replace(/\s+(no|na|em|com|do|da|de|para|por)$/i, '').trim();
  }

  description = description || categoryLabel;
  description = description.slice(0, 120).trim();
  return description.charAt(0).toLocaleUpperCase('pt-BR') + description.slice(1);
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function getTypeLabel(transaction) {
  if (transaction.kind === 'income') {
    return transaction.recordType === 'fixa' ? 'Receita fixa' : 'Receita variável';
  }
  return transaction.recordType === 'fixa' ? 'Despesa fixa' : 'Despesa avulsa';
}

function parseTransactionMessage(text, now = new Date()) {
  const original = String(text || '').trim();
  if (!original || original.startsWith('/')) return null;

  const parsedDate = parseTransactionDate(original, now);
  if (parsedDate.error) return { error: parsedDate.error };

  const amount = extractAmount(parsedDate.text);
  if (!amount) {
    return { error: 'Não encontrei um valor. Exemplo: "gastei 75 no mercado".' };
  }

  const normalized = normalizeText(original);
  const kind = detectKind(normalized);
  const category = detectCategory(kind, normalized);
  const recordType = detectRecordType(kind, normalized);
  const description = cleanDescription(amount.text, category.label);

  return {
    kind,
    recordType,
    amount: amount.value,
    description,
    categoryKey: category.key,
    categoryLabel: category.label,
    date: parsedDate.date,
  };
}

function buildConfirmationText(transaction) {
  return [
    'Revise o lançamento:',
    '',
    `Tipo: ${getTypeLabel(transaction)}`,
    `Valor: ${formatBRL(transaction.amount)}`,
    `Descrição: ${transaction.description}`,
    `Categoria: ${transaction.categoryLabel}`,
    `Data: ${formatDisplayDate(transaction.date)}`,
    '',
    'Deseja salvar?',
  ].join('\n');
}

function parseConfirmationText(text) {
  const value = String(text || '');
  const type = /^Tipo:\s*(.+)$/mi.exec(value)?.[1]?.trim();
  const amount = /^Valor:\s*(.+)$/mi.exec(value)?.[1]?.trim();
  const description = /^Descrição:\s*(.+)$/mi.exec(value)?.[1]?.trim();
  const categoryLabel = /^Categoria:\s*(.+)$/mi.exec(value)?.[1]?.trim();
  const displayDate = /^Data:\s*(\d{2})\/(\d{2})\/(\d{4})$/mi.exec(value);

  if (!type || !amount || !description || !categoryLabel || !displayDate) return null;

  const normalizedType = normalizeText(type);
  const kind = normalizedType.startsWith('receita') ? 'income' : 'expense';
  const recordType =
    kind === 'income'
      ? normalizedType.includes('fixa') ? 'fixa' : 'variavel'
      : normalizedType.includes('fixa') ? 'fixa' : 'avulsa';
  const categories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const category = categories.find(
    (item) => normalizeText(item.label) === normalizeText(categoryLabel)
  );
  const date = toISODate(Number(displayDate[3]), Number(displayDate[2]), Number(displayDate[1]));
  const parsedAmount = parseCurrencyNumber(amount);

  if (!date || parsedAmount == null) return null;

  return {
    kind,
    recordType,
    amount: parsedAmount,
    description,
    categoryKey: category?.key || (kind === 'income' ? 'outras_receitas' : 'compras'),
    categoryLabel,
    date,
  };
}

function parseAllowedUserIds(rawValue) {
  return new Set(
    String(rawValue || '')
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter(Number.isSafeInteger)
  );
}

export {
  buildConfirmationText,
  formatBRL,
  getTypeLabel,
  parseAllowedUserIds,
  parseConfirmationText,
  parseCurrencyNumber,
  parseTransactionMessage,
};
