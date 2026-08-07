import assert from 'node:assert/strict';
import test from 'node:test';
import handler, { buildReply, getCommand, secretsMatch } from '../api/telegram.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function withTelegramEnv(callback) {
  const names = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'TELEGRAM_WEB_APP_URL'];
  const previous = names.map((name) => process.env[name]);
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
  process.env.TELEGRAM_WEB_APP_URL = 'https://example.com/app/';

  try {
    await callback();
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
}

test('reconhece comandos com o nome do bot', () => {
  assert.equal(getCommand('/start@MeuBot convite'), '/start');
  assert.equal(getCommand('/APP'), '/app');
});

test('compara o segredo do webhook com segurança', () => {
  assert.equal(secretsMatch('abc123', 'abc123'), true);
  assert.equal(secretsMatch('abc123', 'diferente'), false);
  assert.equal(secretsMatch('', 'abc123'), false);
});

test('monta uma resposta com botão para o Web App', () => {
  const reply = buildReply(
    { chat: { id: 123 }, from: { first_name: 'Marcelo' }, text: '/start' },
    'https://example.com/app/',
  );
  assert.equal(reply.chat_id, 123);
  assert.match(reply.text, /Marcelo/);
  assert.equal(reply.reply_markup.inline_keyboard[0][0].web_app.url, 'https://example.com/app/');
});

test('GET expõe somente o estado da configuração', async () => {
  await withTelegramEnv(async () => {
    const res = createResponse();
    await handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.botConfigured, true);
    assert.equal(res.body.webhookSecretConfigured, true);
    assert.equal(JSON.stringify(res.body).includes('test-token'), false);
    assert.equal(JSON.stringify(res.body).includes('test-secret'), false);
  });
});

test('POST rejeita uma chamada sem o segredo correto', async () => {
  await withTelegramEnv(async () => {
    const res = createResponse();
    await handler({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'errado' },
      body: { update_id: 1 },
    }, res);
    assert.equal(res.statusCode, 401);
  });
});

test('POST responde a um update válido do Telegram', async () => {
  await withTelegramEnv(async () => {
    const originalFetch = global.fetch;
    let sentRequest;
    global.fetch = async (url, options) => {
      sentRequest = { url, options };
      return { ok: true };
    };

    try {
      const res = createResponse();
      await handler({
        method: 'POST',
        headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
        body: {
          update_id: 10,
          message: { chat: { id: 456 }, from: { first_name: 'Ana' }, text: '/app' },
        },
      }, res);

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, { success: true, handled: true });
      assert.match(sentRequest.url, /\/bottest-token\/sendMessage$/);
      const payload = JSON.parse(sentRequest.options.body);
      assert.equal(payload.chat_id, 456);
      assert.equal(payload.reply_markup.inline_keyboard[0][0].web_app.url, 'https://example.com/app/');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
