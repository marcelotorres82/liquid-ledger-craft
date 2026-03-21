import { PrismaClient } from './prisma/generated/client/index.js';
import { PrismaSQLite } from '@prisma/adapter-sqlite';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do banco de dados SQLite
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(__dirname, 'prisma', 'dev.db');

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Verifica se estamos usando Prisma 7+ (que requer adapter)
  try {
    const db = new Database(dbPath);
    const adapter = new PrismaSQLite(db);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch {
    // Fallback para Prisma 5.x (sem adapter)
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
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

