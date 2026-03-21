const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function main() {
  console.log('🌱 Criando banco SQLite...');
  
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
  
  console.log('✅ Usuário criado:', admin.email);
  console.log('🔑 Senha:', defaultPassword);
  await prisma.$disconnect();
  console.log('✅ Banco pronto!');
}

main().catch(console.error);
