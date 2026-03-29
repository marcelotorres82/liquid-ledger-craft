import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, 'dev.db')}`;
const libsql = createClient({ url: dbPath });
const adapter = new PrismaLibSQL(libsql);
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
        dataRegistro: new Date('2026-03-05'),
      },
      {
        usuarioId: admin.id,
        descricao: 'Freelance',
        valor: 1500.00,
        tipo: 'variavel',
        dataRegistro: new Date('2026-03-10'),
      },
      {
        usuarioId: admin.id,
        descricao: 'Investimentos',
        valor: 300.00,
        tipo: 'variavel',
        dataRegistro: new Date('2026-03-12'),
      },
    ],
  });

  console.log('✅ Receitas de exemplo criadas');

  // Limpar todas as despesas existentes do usuário (inclui pagamentos por cascata).
  await prisma.pagamentoDespesa.deleteMany({
    where: {
      despesa: {
        usuarioId: admin.id,
      },
    },
  });
  await prisma.despesa.deleteMany({
    where: {
      usuarioId: admin.id,
    },
  });

  // Criar despesas conforme lista informada (referência principal: Março/2026).
  await prisma.despesa.createMany({
    data: [
      // Contas com vencimento mensal (fixas recorrentes a partir de Março/2026)
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Aluguel', valorParcela: 1050.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:transporte] Carro', valorParcela: 1010.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:transporte] Van', valorParcela: 320.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Seguro de vida', valorParcela: 21.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_variaveis] Vivo', valorParcela: 63.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_variaveis] Claro', valorParcela: 120.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Mesada', valorParcela: 50.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:educacao] Escola', valorParcela: 973.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },

      // Contas com valor variável (tratadas como despesas fixas, mas categorizadas como variáveis)
      { usuarioId: admin.id, descricao: '[cat:contas_variaveis] Internet', valorParcela: 470.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_variaveis] Cartão', valorParcela: 650.0, tipo: 'fixa', dataInicio: new Date('2026-03-01'), parcelasTotal: 1 },

      // Gisele (valores por mês; não deve aparecer fora do mês registrado)
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Gisele', valorParcela: 500.0, tipo: 'avulsa', dataInicio: new Date('2026-03-10'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Gisele', valorParcela: 1000.0, tipo: 'avulsa', dataInicio: new Date('2026-04-10'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Gisele', valorParcela: 1000.0, tipo: 'avulsa', dataInicio: new Date('2026-05-10'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_fixas] Gisele', valorParcela: 950.0, tipo: 'avulsa', dataInicio: new Date('2026-06-10'), parcelasTotal: 1 },

      // IPVA (apenas Maio)
      { usuarioId: admin.id, descricao: '[cat:impostos] IPVA', valorParcela: 800.0, tipo: 'avulsa', dataInicio: new Date('2026-05-15'), parcelasTotal: 1 },

      // Compras do mês (Março)
      { usuarioId: admin.id, descricao: '[cat:compras] Compras variadas', valorParcela: 964.0, tipo: 'avulsa', dataInicio: new Date('2026-03-02'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:compras] Livros', valorParcela: 1800.0, tipo: 'avulsa', dataInicio: new Date('2026-03-03'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:saude] Gympass', valorParcela: 55.0, tipo: 'avulsa', dataInicio: new Date('2026-03-04'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:transporte] Uber', valorParcela: 105.0, tipo: 'avulsa', dataInicio: new Date('2026-03-05'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:contas_variaveis] Diversos', valorParcela: 10.0, tipo: 'avulsa', dataInicio: new Date('2026-03-06'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:alimentacao] Pizza', valorParcela: 66.0, tipo: 'avulsa', dataInicio: new Date('2026-03-07'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:alimentacao] Sorvete', valorParcela: 30.0, tipo: 'avulsa', dataInicio: new Date('2026-03-08'), parcelasTotal: 1 },
      { usuarioId: admin.id, descricao: '[cat:saude] Farmácia', valorParcela: 28.0, tipo: 'avulsa', dataInicio: new Date('2026-03-09'), parcelasTotal: 1 },
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
