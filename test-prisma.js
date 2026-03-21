import { PrismaClient } from '@prisma/client';

console.log('Testing Prisma connection...');

try {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db'
      }
    }
  });
  
  console.log('Prisma client created');
  
  await prisma.$connect();
  console.log('Connected to database');
  
  const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
  console.log('Tables:', result);
  
  await prisma.$disconnect();
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
