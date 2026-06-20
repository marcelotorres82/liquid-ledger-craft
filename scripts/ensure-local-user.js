import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const password = process.env.DEFAULT_PASSWORD;
if (!password) throw new Error('DEFAULT_PASSWORD nao esta definida.');

const prisma = new PrismaClient();
const senha = await bcrypt.hash(password, 10);

await prisma.usuario.upsert({
  where: { email: 'marcelo' },
  update: { senha },
  create: {
    nome: 'Marcelo Torres',
    email: 'marcelo',
    senha,
  },
});

await prisma.$disconnect();
