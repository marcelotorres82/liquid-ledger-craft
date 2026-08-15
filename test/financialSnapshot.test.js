import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFinancialContext } from '../lib/finance/snapshot.js';

test('inclui despesas fixas iniciadas antes do período em cada mês analisado', async () => {
  const now = new Date();
  const oldStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const prisma = {
    receita: { findMany: async () => [] },
    despesa: {
      findMany: async () => [{
        id: 1,
        descricao: '[cat:moradia] Aluguel',
        valorParcela: 1000,
        valorPrimeiraParcela: null,
        tipo: 'fixa',
        categoria: 'moradia',
        estabelecimento: '',
        conta: '',
        paga: true,
        parcelasTotal: 1,
        dataInicio: oldStart,
      }],
    },
    orcamento: { findMany: async () => [] },
    metaFinanceira: { findMany: async () => [] },
  };

  const context = await loadFinancialContext(prisma, 1, 3);
  assert.equal(context.periodMonths, 3);
  assert.equal(context.totals.expenses, 3000);
  assert.equal(context.categories[0].category, 'moradia');
  assert.equal(context.categories[0].value, 3000);
});
