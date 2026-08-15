import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { handleApiError } from '../lib/errorHandler.js';

function period(req) {
  const now = new Date();
  const month = Number(req.query?.mes ?? req.body?.month) || now.getMonth() + 1;
  const year = Number(req.query?.ano ?? req.body?.year) || now.getFullYear();
  return { month: Math.min(12, Math.max(1, month)), year };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  const current = period(req);

  try {
    if (req.method === 'GET') {
      const rows = await prisma.orcamento.findMany({
        where: { usuarioId: userId, mes: current.month, ano: current.year, ativo: true },
        orderBy: { categoria: 'asc' },
      });
      return res.status(200).json({
        success: true,
        budgets: rows.map((row) => ({
          id: row.id, category: row.categoria, amount: row.limiteCentavos / 100,
          month: row.mes, year: row.ano,
        })),
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const category = String(req.body?.category || '').trim().slice(0, 60);
      const amount = Number(req.body?.amount);
      if (!category || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Categoria e limite são obrigatórios.' });
      }
      const row = await prisma.orcamento.upsert({
        where: { usuarioId_categoria_mes_ano: { usuarioId: userId, categoria: category, mes: current.month, ano: current.year } },
        create: { usuarioId: userId, categoria: category, limiteCentavos: Math.round(amount * 100), mes: current.month, ano: current.year },
        update: { limiteCentavos: Math.round(amount * 100), ativo: true },
      });
      return res.status(200).json({ success: true, id: row.id, message: 'Orçamento atualizado.' });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id);
      await prisma.orcamento.updateMany({ where: { id, usuarioId: userId }, data: { ativo: false } });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  } catch (error) {
    return handleApiError(error, res);
  }
}
