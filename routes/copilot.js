import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { enforceRateLimit } from '../lib/rateLimit.js';
import { generateStructured, recordAiRun } from '../lib/ai/providers.js';
import { buildLocalCopilotAnswer, parseRequestedPeriodMonths } from '../lib/ai/copilotFallback.js';
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

function safeErrorMessage(error) {
  return String(error instanceof Error ? error.message : 'falha desconhecida')
    .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .slice(0, 800);
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
    const periodMonths = parseRequestedPeriodMonths(question, 12);
    const context = await loadFinancialContext(prisma, userId, periodMonths);
    let result;
    try {
      result = await generateStructured({
        preferred: 'gemini', userId, schema: COPILOT_SCHEMA, schemaName: 'financial_copilot',
        instructions: [
          'Você é um copiloto financeiro pessoal em português do Brasil.',
          'Use somente os dados fornecidos. Não dê recomendação de investimento específica.',
          'Mostre cálculos ou evidências concisas. Nunca execute ações: apenas proponha uma ação confirmável.',
          'Se os dados forem insuficientes, diga isso claramente.',
          'Responda diretamente à pergunta feita; não substitua a resposta por um resumo financeiro genérico.',
          `O período solicitado e já filtrado é de ${periodMonths} meses. Não use outro período.`,
        ].join(' '),
        input: `Pergunta: ${question}\n\nDados financeiros: ${JSON.stringify(context)}`,
      });
      await recordAiRun(prisma, userId, 'copilot', result, 'success', { questionLength: question.length });
    } catch (error) {
      const reason = safeErrorMessage(error);
      console.warn('[copilot] Gemini indisponível; usando fallback local:', reason);
      result = { data: buildLocalCopilotAnswer(question, context), provider: 'local', model: 'local-copilot-v2' };
      await recordAiRun(prisma, userId, 'copilot', result, 'fallback', {
        error: reason,
        questionLength: question.length,
        periodMonths,
      });
    }
    return res.status(200).json({
      success: true,
      ...result.data,
      source: result.provider,
      model: result.model,
      degraded: result.provider === 'local',
      notice: result.provider === 'local'
        ? 'O Gemini não respondeu nesta tentativa. Usei seus dados com regras locais para responder à pergunta.'
        : null,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
