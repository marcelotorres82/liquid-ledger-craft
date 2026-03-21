import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Prisma 7: connection URL is passed via constructor, not schema file.
  // Use PRISMA_DATABASE_URL (Accelerate) or DATABASE_URL (direct connection).
  const accelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

  return new PrismaClient({
    accelerateUrl,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

/**
 * Helper para queries SQL brutas (Raw SQL) para manter compatibilidade
 * com o antigo lib/db.js onde necessário.
 */
export async function queryRaw(sql, params = []) {
  let result;
  if (Array.isArray(params) && params.length > 0) {
    result = await prisma.$queryRawUnsafe(sql, ...params);
  } else {
    result = await prisma.$queryRawUnsafe(sql);
  }
  return { rows: result };
}

export default prisma;
