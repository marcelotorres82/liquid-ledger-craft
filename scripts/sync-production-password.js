import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const password = process.env.DEFAULT_PASSWORD;

if (!process.env.VERCEL) {
  console.log('[auth-sync] Ambiente local detectado; sincronização de produção ignorada.');
} else if (!password) {
  console.log('[auth-sync] DEFAULT_PASSWORD ausente; senha existente preservada.');
} else {
  const prisma = new PrismaClient();
  try {
    const login = String(process.env.DEFAULT_LOGIN || 'marcelo').trim();
    const user = await prisma.usuario.findFirst({
      where: { OR: [{ email: login }, { nome: login }] },
      select: { id: true },
    });

    const passwordHash = await bcrypt.hash(password, 12);
    if (user) {
      await prisma.usuario.update({ where: { id: user.id }, data: { senha: passwordHash } });
    } else {
      await prisma.usuario.create({ data: { nome: login, email: login, senha: passwordHash } });
    }
    console.log('[auth-sync] Credencial de login sincronizada com sucesso.');
  } finally {
    await prisma.$disconnect();
  }
}
