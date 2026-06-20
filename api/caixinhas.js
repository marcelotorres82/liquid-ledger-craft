import prisma from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { handleApiError } from '../lib/errorHandler.js';

const CAIXINHA_SAVED_TYPE = 'caixinha_guardado';
const DESCRIPTION = 'Valor guardado no mês';

function getMonthStart(ano, mes) {
  return new Date(Date.UTC(ano, mes - 1, 1));
}

function parsePeriod(query) {
  const mes = Number.parseInt(query.mes, 10);
  const ano = Number.parseInt(query.ano, 10);

  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano)) {
    return null;
  }

  return { mes, ano };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = await verifyToken(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const periodo = parsePeriod(req.query);
  if (!periodo) {
    return res.status(400).json({ success: false, message: 'Mês ou ano inválido' });
  }

  const inicioMes = getMonthStart(periodo.ano, periodo.mes);
  const inicioMesSeguinte = getMonthStart(periodo.ano, periodo.mes + 1);
  const where = {
    usuarioId: userId,
    tipo: CAIXINHA_SAVED_TYPE,
    dataRegistro: {
      gte: inicioMes,
      lt: inicioMesSeguinte,
    },
  };

  try {
    if (req.method === 'PUT') {
      const valor = Number.parseFloat(req.body?.valor_guardado);
      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({ success: false, message: 'Valor guardado inválido' });
      }

      const existente = await prisma.receita.findFirst({ where, select: { id: true } });
      if (existente) {
        await prisma.receita.update({
          where: { id: existente.id },
          data: {
            descricao: DESCRIPTION,
            valor,
            dataRegistro: inicioMes,
          },
        });
      } else {
        await prisma.receita.create({
          data: {
            usuarioId: userId,
            descricao: DESCRIPTION,
            valor,
            tipo: CAIXINHA_SAVED_TYPE,
            dataRegistro: inicioMes,
          },
        });
      }

      return res.status(200).json({ success: true, valor_guardado: valor });
    }

    if (req.method === 'DELETE') {
      await prisma.receita.deleteMany({ where });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Método não permitido' });
  } catch (error) {
    return handleApiError(error, res);
  }
}
