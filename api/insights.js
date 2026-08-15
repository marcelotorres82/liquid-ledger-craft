import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { handleApiError } from '../lib/errorHandler.js';
import { enforceRateLimit } from '../lib/rateLimit.js';
import { generateStructured, recordAiRun } from '../lib/ai/providers.js';
import { loadFinancialContext } from '../lib/finance/snapshot.js';

const INSIGHTS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    insights: {
      type: 'array', minItems: 3, maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['info', 'success', 'warning', 'critical'] },
          title: { type: 'string' }, description: { type: 'string' }, evidence: { type: 'string' },
          impact: { type: 'number' }, recommendation: { type: 'string' },
          actionType: { type: 'string', enum: ['none', 'create_budget', 'review_expenses', 'open_savings'] },
          actionLabel: { type: 'string' }, actionCategory: { type: 'string' }, actionAmount: { type: 'number' },
        },
        required: ['severity', 'title', 'description', 'evidence', 'impact', 'recommendation', 'actionType', 'actionLabel', 'actionCategory', 'actionAmount'],
      },
    },
  },
  required: ['summary', 'insights'],
};

function referencePeriod(req) {
  const now = new Date();
  return {
    month: Number(req.query?.mes ?? req.body?.mes) || now.getMonth() + 1,
    year: Number(req.query?.ano ?? req.body?.ano) || now.getFullYear(),
  };
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function localInsights(context) {
  const monthCount = Math.max(1, context.monthly.length);
  const avgExpense = context.totals.expenses / monthCount;
  const latest = context.monthly.at(-1) || { income: 0, expenses: 0, balance: 0 };
  const top = context.categories[0];
  const savingsRate = latest.income > 0 ? (latest.balance / latest.income) * 100 : 0;
  return {
    summary: 'Leitura calculada localmente com base no histórico disponível.',
    insights: [
      {
        severity: latest.balance >= 0 ? 'success' : 'critical', title: latest.balance >= 0 ? 'Mês com saldo positivo' : 'Atenção ao déficit mensal',
        description: latest.balance >= 0 ? `Você encerrou o período com ${money(latest.balance)} de margem.` : `As despesas superaram as receitas em ${money(Math.abs(latest.balance))}.`,
        evidence: `Receitas ${money(latest.income)} · despesas ${money(latest.expenses)}`, impact: Math.abs(latest.balance),
        recommendation: latest.balance >= 0 ? 'Direcione parte da sobra para uma meta.' : 'Revise primeiro as maiores despesas variáveis.',
        actionType: latest.balance >= 0 ? 'open_savings' : 'review_expenses', actionLabel: latest.balance >= 0 ? 'Ver caixinhas' : 'Revisar despesas', actionCategory: '', actionAmount: Math.max(0, latest.balance * 0.2),
      },
      {
        severity: latest.expenses > avgExpense * 1.15 ? 'warning' : 'info', title: 'Comparação com sua média',
        description: `A média de despesas dos últimos ${monthCount} meses é ${money(avgExpense)}.`, evidence: `Mês mais recente: ${money(latest.expenses)}`,
        impact: latest.expenses - avgExpense, recommendation: latest.expenses > avgExpense ? 'Investigue o que elevou o mês atual.' : 'Seu gasto está controlado em relação ao histórico.',
        actionType: 'review_expenses', actionLabel: 'Abrir análise', actionCategory: '', actionAmount: 0,
      },
      {
        severity: savingsRate >= 20 ? 'success' : 'warning', title: 'Taxa de poupança',
        description: `A sobra equivale a ${savingsRate.toFixed(1).replace('.', ',')}% das receitas do período.`,
        evidence: top ? `Maior categoria: ${top.category} (${money(top.value)})` : 'Poucos dados categorizados.', impact: latest.balance,
        recommendation: savingsRate >= 20 ? 'Mantenha o ritmo e acompanhe suas metas.' : 'Defina um teto para a maior categoria de gastos.',
        actionType: top ? 'create_budget' : 'none', actionLabel: top ? 'Criar orçamento' : '', actionCategory: top?.category || '', actionAmount: top ? Math.max(1, top.value / monthCount * 0.9) : 0,
      },
    ],
  };
}

function legacyText(data) {
  return data.insights.map((item) => `• **${item.title}:** ${item.description} ${item.recommendation}`).join('\n');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  const { month, year } = referencePeriod(req);
  try {
    if (req.method === 'GET') {
      const row = await prisma.insight.findUnique({ where: { usuarioId_mes_ano: { usuarioId: userId, mes: month, ano: year } } });
      if (!row) return res.status(200).json({ success: false, message: 'Nenhum insight disponível. Gere uma nova análise.' });
      let structured = null;
      try { structured = row.dadosEstruturados ? JSON.parse(row.dadosEstruturados) : null; } catch { structured = null; }
      return res.status(200).json({
        success: true, insight: row.conteudo, insights: structured?.insights || [], summary: structured?.summary || '',
        updated_at: row.updatedAt, source: row.provedor || 'local', model: row.modelo || 'local-rules-v2',
      });
    }
    if (req.method === 'POST') {
      if (!enforceRateLimit(req, res, { scope: `insights-${userId}`, limit: 8, windowMs: 60_000 })) return;
      const context = await loadFinancialContext(prisma, userId, 12);
      let result;
      try {
        result = await generateStructured({
          preferred: 'gemini', userId, schema: INSIGHTS_SCHEMA, schemaName: 'financial_insights',
          instructions: 'Gere 3 ou 4 insights financeiros pessoais acionáveis em português do Brasil. Compare meses e categorias somente com os dados fornecidos. Use valores exatos nas evidências. Não recomende ativos ou produtos financeiros. Toda ação deve exigir confirmação no aplicativo.',
          input: JSON.stringify({ selectedPeriod: { month, year }, context }),
        });
      } catch (error) {
        result = { data: localInsights(context), provider: 'local', model: 'local-rules-v2', latencyMs: 0, usage: {}, error };
      }
      const content = legacyText(result.data);
      await prisma.insight.upsert({
        where: { usuarioId_mes_ano: { usuarioId: userId, mes: month, ano: year } },
        create: { usuarioId: userId, mes: month, ano: year, conteudo: content, dadosEstruturados: JSON.stringify(result.data), provedor: result.provider, modelo: result.model },
        update: { conteudo: content, dadosEstruturados: JSON.stringify(result.data), provedor: result.provider, modelo: result.model },
      });
      await recordAiRun(prisma, userId, 'insights', result, result.provider === 'local' ? 'fallback' : 'success');
      return res.status(200).json({ success: true, insight: content, ...result.data, source: result.provider, model: result.model });
    }
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  } catch (error) {
    return handleApiError(error, res);
  }
}
