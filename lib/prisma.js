import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function getDatasourceUrl() {
  const primary = process.env.DATABASE_URL?.trim();
  const fallback = process.env.POSTGRES_URL?.trim();
  const primaryIsTemplate =
    !primary ||
    primary.includes('HOST:PORT') ||
    primary.includes('/DATABASE');

  return primaryIsTemplate && fallback ? fallback : primary;
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
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
