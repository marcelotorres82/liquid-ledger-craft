import { createHash } from 'node:crypto';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = 'gpt-5.6-luna';
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
const DEFAULT_TIMEOUT_MS = 25_000;

function safeJsonParse(value) {
  if (typeof value !== 'string') return value;
  const clean = value.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(clean);
}

function extractOpenAIText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function safetyIdentifier(userId) {
  return createHash('sha256').update(`liquid-ledger:${userId || 'anonymous'}`).digest('hex');
}

export function getAiAvailability(env = process.env) {
  const mode = String(env.AI_PROVIDER_MODE || 'gemini-only').toLowerCase();
  return {
    openai: Boolean(env.OPENAI_API_KEY) && !['gemini-only', 'local-only'].includes(mode),
    gemini: Boolean(env.GEMINI_API_KEY) && mode !== 'local-only',
    perplexity: Boolean(env.PERPLEXITY_API_KEY) && !['gemini-only', 'local-only'].includes(mode),
  };
}

export function buildGeminiContents(instructions, input, imageDataUrl) {
  const prompt = `${instructions}\n\nEntrada:\n${typeof input === 'string' ? input : JSON.stringify(input)}`;
  if (!imageDataUrl) return prompt;
  const match = String(imageDataUrl).match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error('Imagem inválida para o Gemini');
  return [{
    role: 'user',
    parts: [
      { text: prompt },
      { inlineData: { mimeType: match[1], data: match[2] } },
    ],
  }];
}

export async function callOpenAIJson({
  instructions,
  input,
  schema,
  schemaName,
  userId,
  env = process.env,
  fetchImpl = globalThis.fetch,
}) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
        instructions,
        input,
        store: false,
        safety_identifier: safetyIdentifier(userId),
        reasoning: { effort: env.OPENAI_REASONING_EFFORT || 'low' },
        max_output_tokens: Number(env.AI_MAX_OUTPUT_TOKENS) || 1400,
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OpenAI HTTP ${response.status}`);
    }

    const text = extractOpenAIText(payload);
    if (!text) throw new Error('OpenAI retornou uma resposta vazia');

    return {
      data: safeJsonParse(text),
      provider: 'openai',
      model: payload.model || env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      latencyMs: Date.now() - startedAt,
      usage: {
        inputTokens: payload?.usage?.input_tokens || null,
        outputTokens: payload?.usage?.output_tokens || null,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGeminiJson({ instructions, input, imageDataUrl, schema, userId, env = process.env }) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const startedAt = Date.now();
  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    contents: buildGeminiContents(instructions, input, imageDataUrl),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      maxOutputTokens: Number(env.AI_MAX_OUTPUT_TOKENS) || 1400,
    },
  });

  if (!response.text) throw new Error('Gemini retornou uma resposta vazia');
  return {
    data: safeJsonParse(response.text),
    provider: 'gemini',
    model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    latencyMs: Date.now() - startedAt,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount || null,
      outputTokens: response.usageMetadata?.candidatesTokenCount || null,
    },
    userId,
  };
}

export async function generateStructured({ preferred = 'openai', fallback = true, ...options }) {
  const availability = getAiAvailability(options.env);
  const mode = String((options.env || process.env).AI_PROVIDER_MODE || 'gemini-only').toLowerCase();
  const order = mode === 'local-only'
    ? []
    : mode === 'gemini-only'
      ? ['gemini']
      : preferred === 'gemini'
        ? ['gemini', 'openai']
        : ['openai', 'gemini'];
  const errors = [];

  for (const provider of order) {
    if (!availability[provider]) continue;
    try {
      return provider === 'openai' ? await callOpenAIJson(options) : await callGeminiJson(options);
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : 'falha desconhecida'}`);
      if (!fallback) break;
    }
  }

  throw new Error(errors.join(' | ') || 'Nenhum provedor de IA configurado');
}

export async function recordAiRun(prisma, userId, feature, result, status = 'success', metadata = {}) {
  if (!prisma?.execucaoIA || !userId) return;
  try {
    await prisma.execucaoIA.create({
      data: {
        usuarioId: userId,
        recurso: feature,
        provedor: result?.provider || 'local',
        modelo: result?.model || 'local-rules-v2',
        status,
        tokensEntrada: result?.usage?.inputTokens || null,
        tokensSaida: result?.usage?.outputTokens || null,
        latenciaMs: result?.latencyMs || null,
        metadata: JSON.stringify(metadata).slice(0, 4000),
      },
    });
  } catch (error) {
    console.warn('Não foi possível registrar a execução de IA:', error instanceof Error ? error.message : error);
  }
}
