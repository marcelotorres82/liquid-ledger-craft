import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { generateToken, createTokenCookie, clearTokenCookie, verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { handleApiError, AppError } from '../lib/errorHandler.js';

export default async function handler(req, res) {
  console.log('API Request:', req.method, req.url);
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { action, email, login, senha } = req.body ?? {};

  // LOGIN
  if (action === 'login') {
    try {
      const identificador = String(login ?? email ?? '').trim();
      if (!identificador) {
        return res.status(400).json({ success: false, message: 'Login é obrigatório' });
      }

      const normalizedIdentifier = identificador.toLowerCase();
      let user = await prisma.usuario.findFirst({
        where: {
          OR: [{ email: identificador }, { nome: identificador }],
        },
      });

      // SQLite does not support Prisma string `mode: 'insensitive'`.
      // Fallback to an in-memory case-insensitive match only when exact lookup misses.
      if (!user) {
        const users = await prisma.usuario.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            senha: true,
          },
        });

        user =
          users.find((candidate) => {
            const email = String(candidate.email ?? '').toLowerCase();
            const nome = String(candidate.nome ?? '').toLowerCase();
            return email === normalizedIdentifier || nome === normalizedIdentifier;
          }) ?? null;
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(senha, user.senha);

      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
      }

      const token = generateToken(user.id, user.email);
      res.setHeader('Set-Cookie', createTokenCookie(token));

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
        },
      });
    } catch (error) {
      return handleApiError(error, res);
    }
  }

  // LOGOUT
  if (action === 'logout') {
    res.setHeader('Set-Cookie', clearTokenCookie());
    return res.status(200).json({ success: true, message: 'Logout realizado' });
  }

  // CHECK AUTH
  if (action === 'check') {
    const userId = await verifyToken(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    try {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return handleApiError(error, res);
    }
  }

  return res.status(400).json({ success: false, message: 'Ação inválida' });
}
