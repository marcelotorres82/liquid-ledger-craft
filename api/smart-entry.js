import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { enforceRateLimit } from '../lib/rateLimit.js';
import { parseReceiptImage, parseTransactionIntelligently } from '../lib/ai/transactionParser.js';
import { recordAiRun } from '../lib/ai/providers.js';
import { saveNormalizedTransaction } from '../lib/finance/transactions.js';
import { handleApiError } from '../lib/errorHandler.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  if (!enforceRateLimit(req, res, { scope: `smart-entry-${userId}`, limit: 30, windowMs: 60_000 })) return;

  try {
    const action = req.body?.action || 'parse';
    if (action === 'parse') {
      const parsed = req.body?.imageDataUrl
        ? await parseReceiptImage(req.body.imageDataUrl, { userId })
        : await parseTransactionIntelligently(req.body?.text, { userId, preferred: 'gemini' });
      if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
      await recordAiRun(prisma, userId, 'smart-entry', parsed.ai, 'success', { source: parsed.transaction.source });
      return res.status(200).json({ success: true, transaction: parsed.transaction, warning: parsed.warning });
    }

    if (action === 'confirm') {
      const transaction = req.body?.transaction;
      if (!transaction || !['income', 'expense'].includes(transaction.kind)) {
        return res.status(400).json({ success: false, message: 'Lançamento inválido' });
      }
      const saved = await saveNormalizedTransaction(prisma, userId, transaction, transaction.source || 'smart-entry');
      return res.status(201).json({ success: true, ...saved, message: 'Lançamento confirmado' });
    }

    return res.status(400).json({ success: false, message: 'Ação inválida' });
  } catch (error) {
    return handleApiError(error, res);
  }
}
