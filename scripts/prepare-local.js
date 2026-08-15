import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

process.env.DATABASE_URL ||= 'file:./.local/finance.db';
process.env.JWT_SECRET ||= 'liquid-ledger-local-development-only';
process.env.DEFAULT_PASSWORD ||= 'changeme-local';

if (!process.env.DATABASE_URL?.startsWith('file:')) {
  throw new Error('O modo local requer DATABASE_URL apontando para um arquivo SQLite.');
}

const schema = 'lib/prisma/schema-fixed.prisma';
const prismaCli = 'node_modules/prisma/build/index.js';

mkdirSync('lib/prisma/.local', { recursive: true });
if (!existsSync('lib/prisma/.local/finance.db')) {
  copyFileSync('lib/prisma/dev.db', 'lib/prisma/.local/finance.db');
}

function run(executable, args) {
  const result = spawnSync(executable, args, {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [prismaCli, 'generate', `--schema=${schema}`]);
run(process.execPath, [prismaCli, 'db', 'push', `--schema=${schema}`, '--skip-generate']);

const check = spawnSync(
  process.execPath,
  [
    '--input-type=module',
    '--eval',
    "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); const count = await p.usuario.count(); await p.$disconnect(); process.exit(count > 0 ? 0 : 10);",
  ],
  { env: process.env, stdio: 'inherit' }
);

if (check.status === 10) {
  run(process.execPath, ['lib/prisma/seed.js']);
} else if (check.status !== 0) {
  process.exit(check.status ?? 1);
}

run(process.execPath, ['scripts/ensure-local-user.js']);
