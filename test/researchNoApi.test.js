import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/research.js';
import { generateToken } from '../lib/auth.js';

test('pesquisa abre o Perplexity Web sem chamar API externa', async () => {
  process.env.JWT_SECRET = 'research-test-secret';
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error('fetch externo não deveria ser chamado'); };

  let statusCode = 200;
  let payload;
  const req = {
    method: 'POST',
    headers: { authorization: `Bearer ${generateToken(1, 'teste')}` },
    body: { query: 'taxa Selic hoje' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = {
    setHeader() {},
    status(code) { statusCode = code; return this; },
    json(data) { payload = data; return this; },
    end() { return this; },
  };

  try {
    await handler(req, res);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(statusCode, 200);
  assert.equal(fetchCalled, false);
  assert.equal(payload.mode, 'browser');
  assert.match(payload.results[0].url, /^https:\/\/www\.perplexity\.ai\/search\?q=/);
});
