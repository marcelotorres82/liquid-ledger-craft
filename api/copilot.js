import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { enforceRateLimit } from '../lib/rateLimit.js';
import { generateStructured, recordAiRun } from '../lib/ai/providers.js';
import { loadFinancialContext } from '../lib/finance/snapshot.js';
import { handleApiError } from '../lib/errorHandler.js';

const COPILOT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    headline: { type: 'string' },
    severity: { type: 'string', enum: ['info', 'success', 'warning', 'critical'] },
    evidence: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    suggestions: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    action: {
      type: 'object', additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['none', 'create_budget', 'navigate'] },
        label: { type: 'string' }, category: { type: 'string' }, amount: { type: 'number' },
        path: { type: 'string' }, requiresConfirmation: { type: 'boolean' },
      },
      required: ['type', 'label', 'category', 'amount', 'path', 'requiresConfirmation'],
    },
  },
  required: ['answer', 'headline', 'severity', 'evidence', 'suggestions', 'action'],
};

function localAnswer(context) {
  const average = context.monthly.length ? context.totals.expenses / context.monthly.length : 0;
  const top = context.categories[0];
  return {
    headline: 'Resumo do seu fluxo financeiro', severity: context.totals.balance >= 0 ? 'success' : 'warning',
    answer: `Nos últimos ${context.periodMonths} meses, seu saldo acumulado foi de R$ ${context.totals.balance.toFixed(2)}. A média mensal de despesas foi R$ ${average.toFixed(2)}.`,
    evidence: top ? [`Maior categoria: ${top.category}, R$ ${top.value.toFixed(2)}`] : ['Ainda há poucos lançamentos para comparar.'],
    suggestions: ['Mantenha os lançamentos atualizados para melhorar as previsões.'],
    action: { type: 'none', label: '', category: '', amount: 0, path: '', requiresConfirmation: false },
  };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  if (!enforceRateLimit(req, res, { scope: `copilot-${userId}`, limit: 15, windowMs: 60_000 })) return;

  try {
    const question = String(req.body?.question || '').trim().slice(0, 800);
    if (!question) return res.status(400).json({ success: false, message: 'Escreva uma pergunta.' });
    const context = await loadFinancialContext(prisma, userId, 12);
    let result;
    try {
      result = await generateStructured({
        preferred: 'gemini', userId, schema: COPILOT_SCHEMA, schemaName: 'financial_copilot',
        instructions: [
          'Você é um copiloto financeiro pessoal em português do Brasil.',
          'Use somente os dados fornecidos. Não dê recomendação de investimento específica.',
          'Mostre cálculos ou evidências concisas. Nunca execute ações: apenas proponha uma ação confirmável.',
          'Se os dados forem insuficientes, diga isso claramente.',
        ].join(' '),
        input: `Pergunta: ${question}\n\nDados financeiros: ${JSON.stringify(context)}`,
      });
      await recordAiRun(prisma, userId, 'copilot', result, 'success', { questionLength: question.length });
    } catch (error) {
      result = { data: localAnswer(context), provider: 'local', model: 'local-copilot-v1' };
      await recordAiRun(prisma, userId, 'copilot', result, 'fallback', { error: error instanceof Error ? error.message : 'unknown' });
    }
    return res.status(200).json({ success: true, ...result.data, source: result.provider, model: result.model });
  } catch (error) {
    return handleApiError(error, res);
  }
}
