import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { getAiAvailability } from '../lib/ai/providers.js';
import { handleApiError } from '../lib/errorHandler.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método não permitido' });

  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });

  try {
    const configured = getAiAvailability();
    const mode = String(process.env.AI_PROVIDER_MODE || 'gemini-only').toLowerCase();
    const recentRuns = await prisma.execucaoIA
      .findMany({
        where: { usuarioId: userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { recurso: true, provedor: true, modelo: true, status: true, createdAt: true },
      })
      .catch(() => []);

    return res.status(200).json({
      success: true,
      providers: {
        openai: { configured: Boolean(process.env.OPENAI_API_KEY), enabled: configured.openai, purpose: 'Desativada no modo sem cobrança' },
        gemini: { configured: Boolean(process.env.GEMINI_API_KEY), enabled: configured.gemini, purpose: 'Copiloto, lançamentos, recibos e insights' },
        perplexity: { configured: true, enabled: true, purpose: 'Pesquisa pelo site, sem API' },
        local: { configured: true, purpose: 'Fallback sem custo' },
      },
      mode,
      recentRuns: recentRuns.map((run) => ({
        feature: run.recurso,
        provider: run.provedor,
        model: run.modelo,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
