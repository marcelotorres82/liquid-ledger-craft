import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

function isPlaceholderUrl(connectionString) {
  try {
    const parsed = new URL(connectionString);
    return (
      parsed.hostname === 'host' ||
      parsed.username === 'usuario' ||
      parsed.pathname === '/database'
    );
  } catch {
    return true;
  }
}

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRISMA_URL
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate.startsWith('postgres://') && !candidate.startsWith('postgresql://')) {
      continue;
    }
    if (isPlaceholderUrl(candidate)) {
      continue;
    }
    return candidate;
  }

  if (process.env.PRISMA_DATABASE_URL?.startsWith('prisma+postgres://')) {
    throw new Error(
      'PRISMA_DATABASE_URL (prisma+postgres://) não é compatível com o cliente pg. Configure DATABASE_URL ou POSTGRES_URL com postgres://'
    );
  }

  throw new Error(
    'Nenhuma URL de banco válida encontrada. Configure DATABASE_URL ou POSTGRES_URL com conexão postgres://'
  );
}

function shouldUseSsl(connectionString) {
  try {
    const parsed = new URL(connectionString);
    const sslMode = parsed.searchParams.get('sslmode');
    return sslMode === 'require' || parsed.hostname.endsWith('.prisma.io');
  } catch {
    return false;
  }
}

let pool;

function getPool() {
  if (!pool) {
    const connectionString = resolveDatabaseUrl();
    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

export function getDatabaseUrl() {
  return resolveDatabaseUrl();
}

export async function query(text, params = []) {
  const activePool = getPool();
  return activePool.query(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

// Inicializar tabelas (executar uma vez)
export async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS receitas (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      descricao VARCHAR(255) NOT NULL,
      valor DECIMAL(10, 2) NOT NULL,
      tipo VARCHAR(20) NOT NULL,
      data_registro DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS despesas (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      descricao VARCHAR(255) NOT NULL,
      valor_parcela DECIMAL(10, 2) NOT NULL,
      valor_primeira_parcela DECIMAL(10, 2),
      tipo VARCHAR(20) NOT NULL,
      data_inicio DATE NOT NULL,
      paga BOOLEAN DEFAULT FALSE,
      data_pagamento DATE,
      parcelas_total INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS insights (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      conteudo TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, mes, ano)
    );
  `);

  // Compatibilidade com estruturas antigas sem colunas de auditoria.
  await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE receitas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS valor_primeira_parcela DECIMAL(10, 2);`);
  await query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS paga BOOLEAN DEFAULT FALSE;`);
  await query(`ALTER TABLE despesas ADD COLUMN IF NOT EXISTS data_pagamento DATE;`);
  await query(`UPDATE despesas SET paga = FALSE WHERE paga IS NULL;`);
  await query(`ALTER TABLE despesas ALTER COLUMN paga SET DEFAULT FALSE;`);
  await query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE usuarios ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE usuarios ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE receitas ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE receitas ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE despesas ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE despesas ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE insights ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE insights ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);

  // Criar usuário padrão (idempotente)
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'changeme';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await query(
    `
    INSERT INTO usuarios (nome, email, senha, created_at, updated_at)
    VALUES ('marcelo', 'marcelo', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (email)
    DO UPDATE SET nome = EXCLUDED.nome, senha = EXCLUDED.senha, updated_at = CURRENT_TIMESTAMP;
    `,
    [hashedPassword]
  );
}
