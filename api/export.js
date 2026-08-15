import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { loadFinancialContext } from '../lib/finance/snapshot.js';
import { handleApiError } from '../lib/errorHandler.js';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(context) {
  const header = ['tipo', 'data', 'descricao', 'categoria', 'valor', 'estabelecimento', 'conta'];
  const rows = context.recentTransactions.map((item) => [
    item.kind, item.date, item.description, item.category, item.amount.toFixed(2), item.merchant, item.account,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\n');
}

function toIcs(context) {
  const events = context.recentTransactions.filter((item) => item.kind === 'expense' && !item.paid).map((item, index) => [
    'BEGIN:VEVENT', `UID:liquid-ledger-${index}-${item.date}`, `DTSTART;VALUE=DATE:${item.date.replaceAll('-', '')}`,
    `SUMMARY:${String(item.description).replace(/[\n,;]/g, ' ')}`,
    `DESCRIPTION:Conta de R$ ${item.amount.toFixed(2)} registrada no Liquid Ledger`, 'END:VEVENT',
  ].join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Liquid Ledger//Finance//PT-BR', ...events, 'END:VCALENDAR'].join('\r\n');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método não permitido' });
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  try {
    const context = await loadFinancialContext(prisma, userId, Math.min(60, Number(req.query?.months) || 24));
    const format = String(req.query?.format || 'json');
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="liquid-ledger.csv"');
      return res.status(200).send(`\uFEFF${toCsv(context)}`);
    }
    if (format === 'ics') {
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="vencimentos.ics"');
      return res.status(200).send(toIcs(context));
    }
    return res.status(200).json({ success: true, exportedAt: new Date().toISOString(), ...context });
  } catch (error) {
    return handleApiError(error, res);
  }
}
