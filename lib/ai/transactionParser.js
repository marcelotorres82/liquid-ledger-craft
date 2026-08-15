import { parseTransactionMessage } from '../telegramFinance.js';
import { generateStructured } from './providers.js';

export const FINANCE_CATEGORIES = [
  'alimentacao', 'transporte', 'contas_fixas', 'contas_variaveis', 'saude',
  'educacao', 'impostos', 'assinaturas', 'entretenimento', 'compras',
  'moradia', 'viagem', 'investimentos', 'salario', 'freelance', 'vendas',
  'beneficios', 'outras_receitas',
];

export const TRANSACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['income', 'expense'] },
    amount: { type: 'number', minimum: 0.01 },
    description: { type: 'string', minLength: 1, maxLength: 120 },
    categoryKey: { type: 'string', enum: FINANCE_CATEGORIES },
    categoryLabel: { type: 'string' },
    recordType: { type: 'string', enum: ['fixa', 'variavel', 'avulsa', 'parcelada'] },
    date: { type: 'string', format: 'date' },
    merchant: { type: 'string' },
    account: { type: 'string' },
    installments: { type: 'integer', minimum: 1, maximum: 60 },
    paid: { type: 'boolean' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    notes: { type: 'string' },
  },
  required: [
    'kind', 'amount', 'description', 'categoryKey', 'categoryLabel', 'recordType',
    'date', 'merchant', 'account', 'installments', 'paid', 'confidence', 'notes',
  ],
};

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function normalizeTransaction(data, source) {
  const kind = data.kind === 'income' ? 'income' : 'expense';
  const recordType = kind === 'income'
    ? (data.recordType === 'fixa' ? 'fixa' : 'variavel')
    : (['fixa', 'parcelada', 'avulsa'].includes(data.recordType) ? data.recordType : 'avulsa');
  return {
    kind,
    amount: Math.round(Number(data.amount) * 100) / 100,
    description: String(data.description || data.categoryLabel || 'Lançamento').slice(0, 120),
    categoryKey: String(data.categoryKey || (kind === 'income' ? 'outras_receitas' : 'compras')),
    categoryLabel: String(data.categoryLabel || data.categoryKey || 'Outros'),
    recordType,
    date: /^\d{4}-\d{2}-\d{2}$/.test(data.date || '') ? data.date : todayInSaoPaulo(),
    merchant: String(data.merchant || ''),
    account: String(data.account || ''),
    installments: recordType === 'parcelada' ? Math.max(2, Number(data.installments) || 2) : 1,
    paid: Boolean(data.paid),
    confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0.5)),
    notes: String(data.notes || ''),
    source,
  };
}

export async function parseTransactionIntelligently(text, { userId, preferred = 'gemini', env } = {}) {
  const input = String(text || '').trim();
  if (!input) return { error: 'Descreva um lançamento para continuar.' };

  try {
    const result = await generateStructured({
      preferred,
      userId,
      env,
      schema: TRANSACTION_SCHEMA,
      schemaName: 'financial_transaction',
      instructions: [
        'Extraia exatamente um lançamento financeiro pessoal em português do Brasil.',
        `A data de hoje em São Paulo é ${todayInSaoPaulo()}. Resolva hoje, ontem e datas sem ano.`,
        'Não invente conta ou estabelecimento. Use string vazia quando ausente.',
        'Se houver ambiguidade, diminua confidence. Parcelamento exige installments >= 2.',
      ].join(' '),
      input,
    });
    return { transaction: normalizeTransaction(result.data, result.provider), ai: result };
  } catch (error) {
    const local = parseTransactionMessage(input);
    if (!local || local.error) return { error: local?.error || 'Não consegui interpretar o lançamento.' };
    return {
      transaction: normalizeTransaction({
        ...local,
        merchant: '', account: '', installments: 1, paid: false,
        confidence: 0.62, notes: 'Interpretação pelo motor local',
      }, 'local'),
      warning: error instanceof Error ? error.message : 'IA indisponível; interpretação local utilizada.',
      ai: { provider: 'local', model: 'local-parser-v2', latencyMs: 0, usage: {} },
    };
  }
}

export async function parseReceiptImage(imageDataUrl, { userId, env } = {}) {
  const image = String(imageDataUrl || '');
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image) || image.length > 8_000_000) {
    return { error: 'Imagem inválida ou maior que o limite de 6 MB.' };
  }
  try {
    const result = await generateStructured({
      preferred: 'gemini', fallback: true, userId, env,
      schema: TRANSACTION_SCHEMA, schemaName: 'receipt_transaction',
      instructions: 'Leia este comprovante ou recibo brasileiro e extraia um único lançamento financeiro. Não invente campos ausentes. Datas devem usar YYYY-MM-DD e valores devem representar o total efetivamente pago.',
      input: 'Extraia o lançamento deste recibo e classifique-o.',
      imageDataUrl: image,
    });
    return { transaction: normalizeTransaction(result.data, result.provider), ai: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível ler o recibo.' };
  }
}
