import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalCopilotAnswer, parseRequestedPeriodMonths } from '../lib/ai/copilotFallback.js';

test('respeita o período pedido em meses, trimestre e semestre', () => {
  assert.equal(parseRequestedPeriodMonths('Onde economizei nos últimos 3 meses?'), 3);
  assert.equal(parseRequestedPeriodMonths('Analise o último trimestre'), 3);
  assert.equal(parseRequestedPeriodMonths('Como foi o último semestre?'), 6);
  assert.equal(parseRequestedPeriodMonths('Faça um resumo geral'), 12);
});

test('fallback local responde onde economizar em vez de devolver resumo genérico', () => {
  const answer = buildLocalCopilotAnswer('Onde posso economizar nos últimos 3 meses?', {
    periodMonths: 3,
    totals: { income: 12000, expenses: 9000, balance: 3000 },
    categories: [
      { category: 'alimentação', value: 3000 },
      { category: 'transporte', value: 1500 },
    ],
  });

  assert.match(answer.headline, /alimentação/i);
  assert.match(answer.answer, /últimos 3 meses/i);
  assert.match(answer.answer, /10%/);
  assert.doesNotMatch(answer.headline, /resumo do seu fluxo/i);
});
