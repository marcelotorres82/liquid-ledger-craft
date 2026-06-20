import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const isLocalSqlite = process.env.DATABASE_URL?.startsWith('file:');
const schema = isLocalSqlite
  ? 'lib/prisma/schema-fixed.prisma'
  : 'lib/prisma/schema.prisma';
const prismaCli = 'node_modules/prisma/build/index.js';
const result = spawnSync(process.execPath, [prismaCli, 'generate', `--schema=${schema}`], {
  env: process.env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
