import { PrismaClient } from './generated/client/index.js';
import { PrismaSQLite } from '@prisma/adapter-sqlite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(__dirname, 'dev.db');
const db = new Database(dbPath);
const adapter = new PrismaSQLite(db);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário padrão
  const defaultPassword = process.env.DEFAULT_PASSWORD;
  if (!defaultPassword) {
    console.error('ERRO: A variável de ambiente DEFAULT_PASSWORD não está definida.');
    process.exit(1);
  }
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'marcelo' },
    update: {},
    create: {
      nome: 'marcelo',
      email: 'marcelo',
      senha: hashedPassword,
    },
  });

  console.log('✅ Usuário padrão criado:', admin.email);

  // Criar receitas de exemplo
  await prisma.receita.createMany({
    data: [
      {
        usuarioId: admin.id,
        descricao: 'Salário',
        valor: 5000.00,
        tipo: 'fixa',
        dataRegistro: new Date('2026-02-05'),
      },
      {
        usuarioId: admin.id,
        descricao: 'Freelance',
        valor: 1500.00,
        tipo: 'variavel',
        dataRegistro: new Date('2026-02-10'),
      },
      {
        usuarioId: admin.id,
        descricao: 'Investimentos',
        valor: 300.00,
        tipo: 'variavel',
        dataRegistro: new Date('2026-02-12'),
      },
    ],
  });

  console.log('✅ Receitas de exemplo criadas');

  // Criar despesas de exemplo
  await prisma.despesa.createMany({
    data: [
      {
        usuarioId: admin.id,
        descricao: 'Aluguel',
        valorParcela: 1200.00,
        tipo: 'fixa',
        dataInicio: new Date('2026-02-01'),
        parcelasTotal: 1,
      },
      {
        usuarioId: admin.id,
        descricao: 'Internet',
        valorParcela: 99.90,
        tipo: 'fixa',
        dataInicio: new Date('2026-02-05'),
        parcelasTotal: 1,
      },
      {
        usuarioId: admin.id,
        descricao: 'Netflix',
        valorParcela: 39.90,
        tipo: 'fixa',
        dataInicio: new Date('2026-02-08'),
        parcelasTotal: 1,
      },
      {
        usuarioId: admin.id,
        descricao: 'Notebook Dell',
        valorParcela: 450.00,
        valorPrimeiraParcela: 320.00,
        tipo: 'parcelada',
        dataInicio: new Date('2026-01-15'),
        parcelasTotal: 12,
      },
      {
        usuarioId: admin.id,
        descricao: 'Celular Samsung',
        valorParcela: 200.00,
        tipo: 'parcelada',
        dataInicio: new Date('2025-12-01'),
        parcelasTotal: 10,
      },
      {
        usuarioId: admin.id,
        descricao: 'Taxa cartório',
        valorParcela: 240.00,
        tipo: 'avulsa',
        dataInicio: new Date('2026-02-06'),
        parcelasTotal: 1,
      },
    ],
  });

  console.log('✅ Despesas de exemplo criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
