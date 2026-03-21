import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed simplificado...');

  try {
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
    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
