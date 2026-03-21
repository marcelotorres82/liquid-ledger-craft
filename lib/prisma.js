import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do banco de dados SQLite
const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, 'prisma', 'dev.db')}`;

const globalForPrisma = globalThis;

// Cliente libsql para operações diretas
const libsqlClient = createClient({ url: dbPath });

// Inicializa as tabelas do banco de dados
async function initDatabase() {
  if (globalForPrisma.__dbInitialized) return;
  
  try {
    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE DEFAULT '',
        senha TEXT NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS receitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL DEFAULT '',
        valor REAL NOT NULL,
        tipo TEXT NOT NULL DEFAULT '',
        data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL DEFAULT '',
        valor_parcela REAL NOT NULL,
        valor_primeira_parcela REAL,
        tipo TEXT NOT NULL DEFAULT '',
        data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        paga INTEGER DEFAULT 0,
        data_pagamento DATETIME,
        parcelas_total INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS pagamentos_despesa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        despesa_id INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        valor_pago REAL NOT NULL,
        data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (despesa_id) REFERENCES despesas(id) ON DELETE CASCADE,
        UNIQUE(despesa_id, mes, ano)
      )
    `);

    await libsqlClient.execute(`
      CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        conteudo TEXT NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE(usuario_id, mes, ano)
      )
    `);

    globalForPrisma.__dbInitialized = true;
    console.log('[v0] Database tables initialized');
  } catch (error) {
    console.error('[v0] Error initializing database:', error);
  }
}

function createPrismaClient() {
  const adapter = new PrismaLibSQL(libsqlClient);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Inicializa o banco de dados
initDatabase();

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

