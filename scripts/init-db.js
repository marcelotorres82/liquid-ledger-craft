import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseUrl, initDatabase, closePool } from '../lib/db.js';

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadEnvFiles() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  loadEnvFile(path.resolve(__dirname, '..', '.env'));
  loadEnvFile(path.resolve(__dirname, '..', '.env.local'));
}

loadEnvFiles();

function validateRequiredEnv() {
  const postgresUrl = getDatabaseUrl();
  if (!postgresUrl) {
    throw new Error(
      'URL do banco não está definida. Configure DATABASE_URL ou POSTGRES_URL.'
    );
  }

  let parsed;
  try {
    parsed = new URL(postgresUrl);
  } catch {
    throw new Error('POSTGRES_URL inválida (formato URL).');
  }

  if (parsed.hostname === 'host' || parsed.username === 'usuario' || parsed.pathname === '/database') {
    throw new Error(
      'URL do banco ainda está com valor de exemplo. Use a connection string real do Postgres.'
    );
  }
}

validateRequiredEnv();

initDatabase()
  .then(() => {
    console.log('✅ Database initialized');
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
