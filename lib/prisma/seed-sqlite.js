import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function main() {
  console.log('🌱 Criando banco de dados SQLite...');

  // Criar usuário padrão
  const defaultPassword = '042016';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  try {
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
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }

  await prisma.$disconnect();
  console.log('✅ Banco de dados inicializado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  });
