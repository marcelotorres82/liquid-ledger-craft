import { timingSafeEqual } from 'node:crypto';

const TELEGRAM_API_URL = 'https://api.telegram.org';
const DEFAULT_WEB_APP_URL = 'https://liquid-ledger-craft.vercel.app/app/';

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

function buildReply(message, webAppUrl) {
  const command = getCommand(message.text);
  const firstName = String(message.from?.first_name || '').trim();
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
  let text = `${greeting} Toque no botão abaixo para acessar seu controle financeiro.`;

  if (command === '/help') {
    text = 'Use /app ou o botão abaixo para abrir o App Financeiro.';
  } else if (command && !['/start', '/app'].includes(command)) {
    text = 'Este bot dá acesso rápido ao App Financeiro. Toque no botão abaixo para continuar.';
  }

  return {
    chat_id: message.chat.id,
    text,
    reply_markup: {
      inline_keyboard: [[{
        text: 'Abrir App Financeiro',
        web_app: { url: webAppUrl },
      }]],
    },
  };
}

async function sendTelegramMessage(botToken, payload) {
  const response = await fetch(`${TELEGRAM_API_URL}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const description = result?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram sendMessage falhou: ${description}`);
  }
}

export default async function handler(req, res) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const webAppUrl = process.env.TELEGRAM_WEB_APP_URL || DEFAULT_WEB_APP_URL;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      endpoint: '/api/telegram',
      botConfigured: Boolean(botToken),
      webhookSecretConfigured: Boolean(webhookSecret),
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

  let update;
  try {
    update = parseUpdate(req.body);
  } catch {
    return res.status(400).json({ success: false, message: 'JSON inválido' });
  }

  if (!update || !Number.isInteger(update.update_id)) {
    return res.status(400).json({ success: false, message: 'Update inválido' });
  }

  const message = update.message;
  if (!message?.chat?.id || typeof message.text !== 'string') {
    return res.status(200).json({ success: true, handled: false });
  }

  try {
    await sendTelegramMessage(botToken, buildReply(message, webAppUrl));
    return res.status(200).json({ success: true, handled: true });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha ao responder ao Telegram');
    return res.status(502).json({
      success: false,
      message: 'Não foi possível responder ao Telegram',
    });
  }
}

export { buildReply, getCommand, parseUpdate, secretsMatch };
