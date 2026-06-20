import test from 'node:test';
import assert from 'node:assert/strict';
import { getDatasourceUrl } from '../lib/prismaDatasource.js';

function createLogger() {
  const messages = [];
  return {
    messages,
    logger: {
      info(message) {
        messages.push(message);
      },
    },
  };
}

test('mantém uma DATABASE_URL válida mesmo quando contém palavras parecidas com o placeholder', () => {
  const { logger, messages } = createLogger();
  const primary =
    'postgres://user:password@database.internal:5432/DATABASE_REAL?sslmode=require';

  const result = getDatasourceUrl(
    {
      DATABASE_URL: primary,
      POSTGRES_URL: 'postgres://fallback.example/db',
    },
    logger
  );

  assert.equal(result, primary);
  assert.deepEqual(messages, []);
});

test('prioriza PRISMA_DATABASE_URL com pool no ambiente serverless', () => {
  const { logger, messages } = createLogger();
  const pooled = 'prisma+postgres://accelerate.prisma-data.net/?api_key=secret';

  const result = getDatasourceUrl(
    {
      DATABASE_URL: 'postgres://direct.example/db',
      POSTGRES_URL: 'postgres://fallback.example/db',
      PRISMA_DATABASE_URL: pooled,
    },
    logger
  );

  assert.equal(result, pooled);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /PRISMA_DATABASE_URL/);
  assert.doesNotMatch(messages[0], /secret/);
});

test('ignora PRISMA_DATABASE_URL vazia e mantém DATABASE_URL válida', () => {
  const { logger, messages } = createLogger();
  const primary = 'postgres://direct.example/db';

  const result = getDatasourceUrl(
    {
      DATABASE_URL: primary,
      PRISMA_DATABASE_URL: '   ',
    },
    logger
  );

  assert.equal(result, primary);
  assert.deepEqual(messages, []);
});

test('não troca SQLite local por uma URL de arquivo secundária', () => {
  const { logger, messages } = createLogger();
  const primary = 'file:./local.db';

  const result = getDatasourceUrl(
    {
      DATABASE_URL: primary,
      PRISMA_DATABASE_URL: 'file:./outro.db',
    },
    logger
  );

  assert.equal(result, primary);
  assert.deepEqual(messages, []);
});

test('usa POSTGRES_URL quando DATABASE_URL é o placeholder exato', () => {
  const { logger, messages } = createLogger();
  const fallback = 'postgres://fallback.example/db';

  const result = getDatasourceUrl(
    {
      DATABASE_URL: 'postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require',
      POSTGRES_URL: fallback,
    },
    logger
  );

  assert.equal(result, fallback);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /placeholder de exemplo/);
  assert.doesNotMatch(messages[0], /fallback\.example/);
});

test('usa POSTGRES_URL quando DATABASE_URL não está definida', () => {
  const { logger, messages } = createLogger();
  const fallback = 'postgres://fallback.example/db';

  const result = getDatasourceUrl({ POSTGRES_URL: fallback }, logger);

  assert.equal(result, fallback);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /não está definida/);
  assert.doesNotMatch(messages[0], /fallback\.example/);
});

test('não registra fallback quando POSTGRES_URL também está ausente', () => {
  const { logger, messages } = createLogger();

  assert.equal(getDatasourceUrl({}, logger), undefined);
  assert.deepEqual(messages, []);
});
