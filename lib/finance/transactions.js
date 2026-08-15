import { createHash } from 'node:crypto';

export function expenseDescription(transaction) {
  const description = String(transaction.description || 'Despesa').trim();
  return `[cat:${transaction.categoryKey || 'compras'}] ${description}`;
}

export async function saveNormalizedTransaction(prisma, userId, transaction, origin = 'smart-entry') {
  const date = new Date(`${transaction.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error('Data do lançamento inválida');
  const amount = Math.round(Number(transaction.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor do lançamento inválido');

  const metadata = {
    categoria: transaction.categoryKey || '',
    estabelecimento: transaction.merchant || '',
    conta: transaction.account || '',
    origem: origin,
    confiancaIA: Number.isFinite(Number(transaction.confidence)) ? Number(transaction.confidence) : null,
    notas: transaction.notes || '',
  };

  if (transaction.kind === 'income') {
    const row = await prisma.receita.create({
      data: {
        usuarioId: userId,
        descricao: String(transaction.description || 'Receita').slice(0, 120),
        valor: amount,
        tipo: transaction.recordType === 'fixa' ? 'fixa' : 'variavel',
        dataRegistro: date,
        ...metadata,
      },
      select: { id: true },
    });
    return { id: row.id, kind: 'income' };
  }

  const type = ['fixa', 'parcelada', 'avulsa'].includes(transaction.recordType)
    ? transaction.recordType
    : 'avulsa';
  const installments = type === 'parcelada' ? Math.max(2, Number(transaction.installments) || 2) : 1;
  const row = await prisma.despesa.create({
    data: {
      usuarioId: userId,
      descricao: expenseDescription(transaction),
      valorParcela: amount,
      valorPrimeiraParcela: null,
      tipo: type,
      dataInicio: date,
      paga: Boolean(transaction.paid),
      dataPagamento: transaction.paid ? date : null,
      parcelasTotal: installments,
      ...metadata,
    },
    select: { id: true },
  });
  return { id: row.id, kind: 'expense' };
}

export function transactionBatchHash(filename, transactions) {
  return createHash('sha256')
    .update(`${filename}:${JSON.stringify(transactions)}`)
    .digest('hex');
}
