import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGeminiContents, callOpenAIJson, getAiAvailability } from '../lib/ai/providers.js';

test('informa provedores configurados sem expor chaves', () => {
  assert.deepEqual(getAiAvailability({ AI_PROVIDER_MODE: 'auto', OPENAI_API_KEY: 'secret', GEMINI_API_KEY: '', PERPLEXITY_API_KEY: 'x' }), {
    openai: true, gemini: false, perplexity: true,
  });
});

test('o padrão seguro não usa APIs cobradas', () => {
  assert.deepEqual(getAiAvailability({ OPENAI_API_KEY: 'secret', GEMINI_API_KEY: 'gemini', PERPLEXITY_API_KEY: 'x' }), {
    openai: false, gemini: true, perplexity: false,
  });
});

test('modo gemini-only impede chamadas OpenAI e Perplexity', () => {
  assert.deepEqual(getAiAvailability({
    AI_PROVIDER_MODE: 'gemini-only', OPENAI_API_KEY: 'secret', GEMINI_API_KEY: 'gemini', PERPLEXITY_API_KEY: 'pplx',
  }), { openai: false, gemini: true, perplexity: false });
});

test('prepara recibo multimodal para o Gemini sem alterar a imagem', () => {
  const contents = buildGeminiContents('Leia o recibo', 'Extraia o total', 'data:image/png;base64,YWJj');
  assert.equal(contents[0].parts[1].inlineData.mimeType, 'image/png');
  assert.equal(contents[0].parts[1].inlineData.data, 'YWJj');
});

test('interpreta saída estruturada da Responses API', async () => {
  let requestBody;
  const result = await callOpenAIJson({
    instructions: 'teste', input: 'entrada', userId: 1,
    schemaName: 'test_schema',
    schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean' } }, required: ['ok'] },
    env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model', AI_TIMEOUT_MS: '1000' },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ model: 'test-model', output: [{ content: [{ type: 'output_text', text: '{"ok":true}' }] }], usage: { input_tokens: 5, output_tokens: 2 } }) };
    },
  });
  assert.equal(result.data.ok, true);
  assert.equal(requestBody.store, false);
  assert.equal(requestBody.text.format.strict, true);
  assert.equal(typeof requestBody.safety_identifier, 'string');
});
