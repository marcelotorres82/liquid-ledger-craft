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
