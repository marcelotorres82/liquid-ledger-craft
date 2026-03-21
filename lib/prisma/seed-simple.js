import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário padrão
  const defaultPassword = '042016';
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
  console.log('🔑 Senha:', defaultPassword);

  await prisma.$disconnect();
  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  });
