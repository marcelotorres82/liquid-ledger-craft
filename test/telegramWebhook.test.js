import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildConfirmationText,
  parseConfirmationText,
  parseTransactionMessage,
} from '../lib/telegramFinance.js';
import { handleTelegramRequest } from '../api/telegram.js';

const FIXED_NOW = new Date('2026-08-07T15:00:00.000Z');

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

function createFetchMock() {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({
      url,
      method: options?.method,
      body: options?.body ? JSON.parse(options.body) : null,
    });
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, result: {} };
      },
    };
  };
  return { calls, fetchImpl };
}

function createPrismaMock() {
  const created = { receitas: [], despesas: [] };
  return {
    created,
    usuario: {
      async findUnique() { return null; },
      async findMany() { return [{ id: 7 }]; },
    },
    receita: {
      async create({ data }) {
        created.receitas.push(data);
        return { id: 21 };
      },
    },
    despesa: {
      async create({ data }) {
        created.despesas.push(data);
        return { id: 22 };
      },
    },
  };
}

function createEnv(overrides = {}) {
  return {
    TELEGRAM_BOT_TOKEN: 'test-token',
    TELEGRAM_WEBHOOK_SECRET: 'test-secret',
    TELEGRAM_WEB_APP_URL: 'https://example.com/app/',
    TELEGRAM_ALLOWED_USER_IDS: '111',
    ...overrides,
  };
}

function createMessageUpdate(text, fromId = 111) {
  return {
    update_id: 10,
    message: {
      message_id: 20,
      chat: { id: 456, type: 'private' },
      from: { id: fromId, first_name: 'Ana' },
      text,
    },
  };
}

function createCallbackUpdate(text, action = 'finance:confirm', fromId = 111) {
  return {
    update_id: 11,
    callback_query: {
      id: 'callback-1',
      data: action,
      from: { id: fromId, first_name: 'Ana' },
      message: {
        message_id: 30,
        from: { id: 999, is_bot: true },
        chat: { id: 456, type: 'private' },
        text,
      },
    },
  };
}

async function invoke(update, options = {}) {
  const res = createResponse();
  await handleTelegramRequest(
    {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'test-secret' },
      body: update,
    },
    res,
    options
  );
  return res;
}

test('interpreta "gastei 75 no mercado" como despesa de alimentação', () => {
  const parsed = parseTransactionMessage('gastei 75 no mercado', FIXED_NOW);
  assert.deepEqual(parsed, {
    kind: 'expense',
    recordType: 'avulsa',
    amount: 75,
    description: 'Mercado',
    categoryKey: 'alimentacao',
    categoryLabel: 'Alimentação',
    date: '2026-08-07',
  });
});

test('interpreta receita brasileira e a data de ontem', () => {
  const parsed = parseTransactionMessage(
    'recebi R$ 1.250,50 de freelance ontem',
    FIXED_NOW
  );
  assert.deepEqual(parsed, {
    kind: 'income',
    recordType: 'variavel',
    amount: 1250.5,
    description: 'Freelance',
    categoryKey: 'freelance',
    categoryLabel: 'Freelance',
    date: '2026-08-06',
  });
});

test('interpreta data explícita e conta variável', () => {
  const parsed = parseTransactionMessage(
    'paguei 120,50 de internet em 05/08',
    FIXED_NOW
  );
  assert.equal(parsed.amount, 120.5);
  assert.equal(parsed.description, 'Internet');
  assert.equal(parsed.categoryKey, 'contas_variaveis');
  assert.equal(parsed.date, '2026-08-05');
});

test('informa quando a mensagem não possui valor', () => {
  const parsed = parseTransactionMessage('gastei no mercado', FIXED_NOW);
  assert.match(parsed.error, /valor/i);
});

test('a confirmação preserva todos os dados do lançamento', () => {
  const transaction = parseTransactionMessage('gastei 75 no mercado', FIXED_NOW);
  const confirmation = buildConfirmationText(transaction);
  assert.deepEqual(parseConfirmationText(confirmation), transaction);
});

test('GET não expõe segredos e informa a configuração financeira', async () => {
  const res = createResponse();
  await handleTelegramRequest(
    { method: 'GET', headers: {} },
    res,
    { env: createEnv({ TELEGRAM_FINANCE_USER_EMAIL: 'marcelo' }) }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.botConfigured, true);
  assert.equal(res.body.allowedUsersConfigured, true);
  assert.equal(res.body.financeUserConfigured, true);
  assert.equal(JSON.stringify(res.body).includes('test-token'), false);
  assert.equal(JSON.stringify(res.body).includes('test-secret'), false);
});

test('rejeita POST sem o segredo correto', async () => {
  const res = createResponse();
  await handleTelegramRequest(
    {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'errado' },
      body: { update_id: 1 },
    },
    res,
    { env: createEnv() }
  );
  assert.equal(res.statusCode, 401);
});

test('informa o ID sem criar prévia para usuário não autorizado', async () => {
  const { calls, fetchImpl } = createFetchMock();
  const res = await invoke(
    createMessageUpdate('gastei 75 no mercado', 222),
    { env: createEnv(), fetchImpl }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.authorized, false);
  assert.match(calls[0].body.text, /222/);
  assert.equal(calls[0].body.reply_markup, undefined);
});

test('mensagem financeira autorizada recebe botões de confirmação', async () => {
  const { calls, fetchImpl } = createFetchMock();
  const res = await invoke(
    createMessageUpdate('gastei 75 no mercado'),
    { env: createEnv(), fetchImpl }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.parsed, true);
  assert.match(calls[0].body.text, /Descrição: Mercado/);
  assert.deepEqual(
    calls[0].body.reply_markup.inline_keyboard[0].map((button) => button.callback_data),
    ['finance:confirm', 'finance:cancel']
  );
});

test('Confirmar grava despesa no usuário financeiro e encerra a prévia', async () => {
  const transaction = parseTransactionMessage('gastei 75 no mercado', FIXED_NOW);
  const prismaClient = createPrismaMock();
  const { calls, fetchImpl } = createFetchMock();
  const res = await invoke(
    createCallbackUpdate(buildConfirmationText(transaction)),
    { env: createEnv(), fetchImpl, prismaClient }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.saved, true);
  assert.equal(prismaClient.created.despesas.length, 1);
  assert.deepEqual(prismaClient.created.despesas[0], {
    usuarioId: 7,
    descricao: '[cat:alimentacao] Mercado',
    valorParcela: 75,
    valorPrimeiraParcela: null,
    tipo: 'avulsa',
    dataInicio: new Date('2026-08-07T00:00:00.000Z'),
    paga: false,
    dataPagamento: null,
    parcelasTotal: 1,
  });
  assert.match(calls.at(-1).url, /editMessageText$/);
  assert.match(calls.at(-1).body.text, /Salvo com sucesso/);
});

test('Confirmar grava receita no banco', async () => {
  const transaction = parseTransactionMessage(
    'recebi 500 de freelance em 05/08',
    FIXED_NOW
  );
  const prismaClient = createPrismaMock();
  const { fetchImpl } = createFetchMock();
  const res = await invoke(
    createCallbackUpdate(buildConfirmationText(transaction)),
    { env: createEnv(), fetchImpl, prismaClient }
  );

  assert.equal(res.body.saved, true);
  assert.deepEqual(prismaClient.created.receitas[0], {
    usuarioId: 7,
    descricao: 'Freelance',
    valor: 500,
    tipo: 'variavel',
    dataRegistro: new Date('2026-08-05T00:00:00.000Z'),
  });
});

test('Cancelar remove os botões sem gravar no banco', async () => {
  const transaction = parseTransactionMessage('gastei 75 no mercado', FIXED_NOW);
  const prismaClient = createPrismaMock();
  const { calls, fetchImpl } = createFetchMock();
  const res = await invoke(
    createCallbackUpdate(buildConfirmationText(transaction), 'finance:cancel'),
    { env: createEnv(), fetchImpl, prismaClient }
  );

  assert.equal(res.body.cancelled, true);
  assert.equal(prismaClient.created.despesas.length, 0);
  assert.equal(prismaClient.created.receitas.length, 0);
  assert.match(calls.at(-1).body.text, /Cancelado/);
});
