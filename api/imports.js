import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { enforceRateLimit } from '../lib/rateLimit.js';
import { saveNormalizedTransaction, transactionBatchHash } from '../lib/finance/transactions.js';
import { handleApiError } from '../lib/errorHandler.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  if (!enforceRateLimit(req, res, { scope: `imports-${userId}`, limit: 6, windowMs: 60_000 })) return;

  try {
    const filename = String(req.body?.filename || 'importacao').slice(0, 180);
    const format = String(req.body?.format || 'csv').toLowerCase();
    const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions.slice(0, 500) : [];
    if (!transactions.length) return res.status(400).json({ success: false, message: 'Nenhum lançamento para importar.' });
    const hash = transactionBatchHash(filename, transactions);
    const duplicate = await prisma.importacaoFinanceira.findUnique({
      where: { usuarioId_hash: { usuarioId: userId, hash } }, select: { id: true },
    });
    if (duplicate) return res.status(409).json({ success: false, message: 'Este arquivo já foi importado.' });

    let imported = 0;
    const errors = [];
    await prisma.$transaction(async (tx) => {
      for (const [index, transaction] of transactions.entries()) {
        try {
          await saveNormalizedTransaction(tx, userId, transaction, `import-${format}`);
          imported += 1;
        } catch (error) {
          errors.push({ line: index + 1, message: error instanceof Error ? error.message : 'Lançamento inválido' });
        }
      }
      await tx.importacaoFinanceira.create({
        data: {
          usuarioId: userId, nomeArquivo: filename, formato: format, hash,
          totalItens: transactions.length, itensImportados: imported,
          status: errors.length ? 'partial' : 'completed',
        },
      });
    }, { timeout: 20_000 });
    return res.status(201).json({ success: true, imported, rejected: errors.length, errors: errors.slice(0, 20) });
  } catch (error) {
    return handleApiError(error, res);
  }
}
