import { timingSafeEqual } from 'node:crypto';

import {
  buildConfirmationText,
  parseAllowedUserIds,
  parseConfirmationText,
  parseTransactionMessage,
} from '../lib/telegramFinance.js';

const TELEGRAM_API_URL = 'https://api.telegram.org';
const DEFAULT_WEB_APP_URL = 'https://liquid-ledger-craft.vercel.app/app/';
const TEMPORARY_WEBHOOK_URL = 'https://liquid-ledger-craft.vercel.app/api/telegram';
const CONFIRM_ACTION = 'finance:confirm';
const CANCEL_ACTION = 'finance:cancel';
let defaultPrismaPromise;

function loadDefaultPrisma() {
  defaultPrismaPromise ??= import('../lib/prisma.js').then((module) => module.default);
  return defaultPrismaPromise;
}

function readHeader(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function secretsMatch(received, expected) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(String(received));
  const expectedBuffer = Buffer.from(String(expected));
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function parseUpdate(body) {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  if (typeof body === 'string' || Buffer.isBuffer(body)) return JSON.parse(body.toString());
  return null;
}

function getCommand(text = '') {
  return text.trim().split(/\s+/)[0].toLowerCase().replace(/@[a-z0-9_]+$/i, '');
}

function buildAppButton(webAppUrl, chatType = 'private') {
  if (chatType === 'private') {
    return { text: 'Abrir App Financeiro', web_app: { url: webAppUrl } };
  }
  return { text: 'Abrir App Financeiro', url: webAppUrl };
}

function buildShortcutReply(message, webAppUrl) {
  const firstName = String(message.from?.first_name || '').trim();
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
  const command = getCommand(message.text);
  const text =
    command === '/help'
      ? [
          'Envie um lançamento em linguagem natural.',
          '',
          'Exemplos:',
          '• gastei 75 no mercado',
          '• paguei R$ 120,50 de internet ontem',
          '• recebi 1.500 de freelance em 05/08',
          '',
          'Eu mostrarei os dados para você confirmar antes de salvar.',
        ].join('\n')
      : `${greeting} Envie uma despesa ou receita por mensagem, ou abra o aplicativo.`;

  return {
    chat_id: message.chat.id,
    text,
    reply_markup: {
      inline_keyboard: [[buildAppButton(webAppUrl, message.chat.type)]],
    },
  };
}

function buildAuthorizationReply(message, configured) {
  const userId = message.from?.id;
  const text = configured
    ? `Seu usuário do Telegram não está autorizado. Seu ID é: ${userId}`
    : [
        'O cadastro financeiro pelo Telegram ainda não foi autorizado.',
        `Seu ID do Telegram é: ${userId}`,
        '',
        'Adicione esse número em TELEGRAM_ALLOWED_USER_IDS na Vercel e faça um novo deploy.',
      ].join('\n');

  return { chat_id: message.chat.id, text };
}

function buildConfirmationReply(message, transaction) {
  return {
    chat_id: message.chat.id,
    text: buildConfirmationText(transaction),
    reply_markup: {
      inline_keyboard: [[
        { text: 'Confirmar', callback_data: CONFIRM_ACTION },
        { text: 'Cancelar', callback_data: CANCEL_ACTION },
      ]],
    },
  };
}

async function callTelegram(botToken, method, payload, fetchImpl) {
  const response = await fetchImpl(`${TELEGRAM_API_URL}/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result?.ok === false) {
    const description = result?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram ${method} falhou: ${description}`);
  }

  return result?.result;
}

async function resolveFinanceUserId(prismaClient, env) {
  const configuredId = Number.parseInt(env.TELEGRAM_FINANCE_USER_ID, 10);
  if (Number.isSafeInteger(configuredId) && configuredId > 0) {
    const user = await prismaClient.usuario.findUnique({
      where: { id: configuredId },
      select: { id: true },
    });
    if (!user) throw new Error('TELEGRAM_FINANCE_USER_ID não corresponde a um usuário.');
    return user.id;
  }

  const configuredEmail = String(env.TELEGRAM_FINANCE_USER_EMAIL || '').trim();
  if (configuredEmail) {
    const user = await prismaClient.usuario.findUnique({
      where: { email: configuredEmail },
      select: { id: true },
    });
    if (!user) throw new Error('TELEGRAM_FINANCE_USER_EMAIL não corresponde a um usuário.');
    return user.id;
  }

  const users = await prismaClient.usuario.findMany({
    take: 2,
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (users.length === 1) return users[0].id;

  throw new Error(
    'Configure TELEGRAM_FINANCE_USER_ID ou TELEGRAM_FINANCE_USER_EMAIL na Vercel.'
  );
}

async function saveTransaction(prismaClient, userId, transaction) {
  const date = new Date(`${transaction.date}T00:00:00.000Z`);

  if (transaction.kind === 'income') {
    const receita = await prismaClient.receita.create({
      data: {
        usuarioId: userId,
        descricao: transaction.description,
        valor: transaction.amount,
        tipo: transaction.recordType,
        dataRegistro: date,
      },
      select: { id: true },
    });
    return { id: receita.id, label: 'Receita' };
  }

  const description = `[cat:${transaction.categoryKey}] ${transaction.description}`;
  const despesa = await prismaClient.despesa.create({
    data: {
      usuarioId: userId,
      descricao: description,
      valorParcela: transaction.amount,
      valorPrimeiraParcela: null,
      tipo: transaction.recordType,
      dataInicio: date,
      paga: false,
      dataPagamento: null,
      parcelasTotal: 1,
    },
    select: { id: true },
  });
  return { id: despesa.id, label: 'Despesa' };
}

function isAuthorized(from, allowedUserIds) {
  return Number.isSafeInteger(from?.id) && allowedUserIds.has(from.id);
}

async function handleMessage({ message, botToken, webAppUrl, allowedUserIds, fetchImpl }) {
  if (!message?.chat?.id || typeof message.text !== 'string') {
    return { handled: false };
  }

  const command = getCommand(message.text);
  if (['/start', '/app', '/help'].includes(command)) {
    await callTelegram(botToken, 'sendMessage', buildShortcutReply(message, webAppUrl), fetchImpl);
    return { handled: true };
  }

  if (command === '/id') {
    await callTelegram(
      botToken,
      'sendMessage',
      { chat_id: message.chat.id, text: `Seu ID do Telegram é: ${message.from?.id}` },
      fetchImpl
    );
    return { handled: true };
  }

  if (!isAuthorized(message.from, allowedUserIds)) {
    await callTelegram(
      botToken,
      'sendMessage',
      buildAuthorizationReply(message, allowedUserIds.size > 0),
      fetchImpl
    );
    return { handled: true, authorized: false };
  }

  const transaction = parseTransactionMessage(message.text);
  if (!transaction || transaction.error) {
    await callTelegram(
      botToken,
      'sendMessage',
      {
        chat_id: message.chat.id,
        text:
          transaction?.error ||
          'Não entendi o lançamento. Exemplo: "gastei 75 no mercado".',
      },
      fetchImpl
    );
    return { handled: true, parsed: false };
  }

  await callTelegram(
    botToken,
    'sendMessage',
    buildConfirmationReply(message, transaction),
    fetchImpl
  );
  return { handled: true, parsed: true };
}

async function handleCallback({
  callback,
  botToken,
  allowedUserIds,
  prismaClient,
  fetchImpl,
  env,
}) {
  if (![CONFIRM_ACTION, CANCEL_ACTION].includes(callback?.data)) {
    return { handled: false };
  }

  if (!isAuthorized(callback.from, allowedUserIds)) {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      {
        callback_query_id: callback.id,
        text: `Usuário não autorizado. ID: ${callback.from?.id}`,
        show_alert: true,
      },
      fetchImpl
    );
    return { handled: true, authorized: false };
  }

  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  const originalText = callback.message?.text;
  if (!chatId || !messageId || !originalText || callback.message?.from?.is_bot !== true) {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      {
        callback_query_id: callback.id,
        text: 'Não foi possível validar este lançamento.',
        show_alert: true,
      },
      fetchImpl
    );
    return { handled: true, valid: false };
  }

  if (callback.data === CANCEL_ACTION) {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      { callback_query_id: callback.id, text: 'Lançamento cancelado.' },
      fetchImpl
    );
    await callTelegram(
      botToken,
      'editMessageText',
      {
        chat_id: chatId,
        message_id: messageId,
        text: `${originalText.replace(/\n\nDeseja salvar\?\s*$/i, '')}\n\nCancelado.`,
      },
      fetchImpl
    );
    return { handled: true, cancelled: true };
  }

  const transaction = parseConfirmationText(originalText);
  if (!transaction) {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      {
        callback_query_id: callback.id,
        text: 'Os dados da confirmação são inválidos.',
        show_alert: true,
      },
      fetchImpl
    );
    return { handled: true, valid: false };
  }

  let saved;
  try {
    const activePrisma = prismaClient || await loadDefaultPrisma();
    const userId = await resolveFinanceUserId(activePrisma, env);
    saved = await saveTransaction(activePrisma, userId, transaction);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha ao salvar lançamento');
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      {
        callback_query_id: callback.id,
        text: error instanceof Error ? error.message : 'Não foi possível salvar o lançamento.',
        show_alert: true,
      },
      fetchImpl
    );
    return { handled: true, saved: false };
  }

  try {
    await callTelegram(
      botToken,
      'answerCallbackQuery',
      { callback_query_id: callback.id, text: `${saved.label} salva com sucesso.` },
      fetchImpl
    );
    await callTelegram(
      botToken,
      'editMessageText',
      {
        chat_id: chatId,
        message_id: messageId,
        text: `${originalText.replace(/\n\nDeseja salvar\?\s*$/i, '')}\n\nSalvo com sucesso.`,
      },
      fetchImpl
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? `Lançamento ${saved.id} salvo, mas a confirmação visual falhou: ${error.message}`
        : `Lançamento ${saved.id} salvo, mas a confirmação visual falhou.`
    );
  }

  return { handled: true, saved: true, id: saved.id };
}

async function handleTelegramRequest(
  req,
  res,
  {
    prismaClient = null,
    fetchImpl = (...args) => globalThis.fetch(...args),
    env = process.env,
  } = {}
) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
  const webAppUrl = env.TELEGRAM_WEB_APP_URL || DEFAULT_WEB_APP_URL;
  const allowedUserIds = parseAllowedUserIds(env.TELEGRAM_ALLOWED_USER_IDS);

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      endpoint: '/api/telegram',
      botConfigured: Boolean(botToken),
      webhookSecretConfigured: Boolean(webhookSecret),
      allowedUsersConfigured: allowedUserIds.size > 0,
      financeUserConfigured: Boolean(
        env.TELEGRAM_FINANCE_USER_ID || env.TELEGRAM_FINANCE_USER_EMAIL
      ),
      webAppUrl,
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  if (!botToken || !webhookSecret) {
    return res.status(503).json({
      success: false,
      message: 'Integração do Telegram não configurada',
    });
  }

  const receivedSecret = readHeader(req, 'x-telegram-bot-api-secret-token');
  if (!secretsMatch(receivedSecret, webhookSecret)) {
    return res.status(401).json({ success: false, message: 'Webhook não autorizado' });
  }

  if (req.body?.action === 'configure_webhook_callbacks_20260807') {
    try {
      await callTelegram(
        botToken,
        'setWebhook',
        {
          url: TEMPORARY_WEBHOOK_URL,
          secret_token: webhookSecret,
          allowed_updates: ['message', 'callback_query'],
        },
        fetchImpl
      );
      return res.status(200).json({
        success: true,
        configured: true,
        allowedUpdates: ['message', 'callback_query'],
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Falha ao configurar webhook');
      return res.status(502).json({
        success: false,
        message: 'Não foi possível configurar o webhook do Telegram',
      });
    }
  }

  let update;
  try {
    update = parseUpdate(req.body);
  } catch {
    return res.status(400).json({ success: false, message: 'JSON inválido' });
  }

  if (!update || !Number.isInteger(update.update_id)) {
    return res.status(400).json({ success: false, message: 'Update inválido' });
  }

  try {
    const result = update.callback_query
      ? await handleCallback({
          callback: update.callback_query,
          botToken,
          allowedUserIds,
          prismaClient,
          fetchImpl,
          env,
        })
      : await handleMessage({
          message: update.message,
          botToken,
          webAppUrl,
          allowedUserIds,
          fetchImpl,
        });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha ao processar o Telegram');
    return res.status(502).json({
      success: false,
      message: 'Não foi possível processar a mensagem do Telegram',
    });
  }
}

export default function handler(req, res) {
  return handleTelegramRequest(req, res);
}

export {
  buildConfirmationReply,
  buildShortcutReply,
  getCommand,
  handleTelegramRequest,
  parseUpdate,
  resolveFinanceUserId,
  saveTransaction,
  secretsMatch,
};
