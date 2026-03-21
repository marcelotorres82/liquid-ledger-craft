import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '..', 'lib', 'prisma', 'dev.db')}`;
console.log('Creating database at:', dbPath);

const db = createClient({ url: dbPath });

async function setupDatabase() {
  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE DEFAULT '',
      senha TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
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

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_receitas_usuario_tipo ON receitas(usuario_id, tipo)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_receitas_data ON receitas(data_registro)`);

  await db.execute(`
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

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_despesas_usuario_tipo ON despesas(usuario_id, tipo)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_inicio)`);

  await db.execute(`
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

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_pagamentos_despesa ON pagamentos_despesa(despesa_id)`);

  await db.execute(`
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

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_insights_usuario ON insights(usuario_id, mes, ano)`);

  console.log('Database tables created successfully!');
}

setupDatabase().catch(console.error);
