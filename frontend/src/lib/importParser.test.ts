import { describe, expect, it } from 'vitest';
import { parseCsv, parseOfx } from './importParser';

describe('importação financeira', () => {
  it('interpreta CSV bancário em português', () => {
    const rows = parseCsv('Data;Descrição;Valor\n15/08/2026;Supermercado;-123,45\n16/08/2026;Salário;2500,00');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: 'expense', amount: 123.45, date: '2026-08-15' });
    expect(rows[1]).toMatchObject({ kind: 'income', amount: 2500 });
  });

  it('interpreta colunas separadas de débito e crédito', () => {
    const rows = parseCsv('date,description,debit,credit\n2026-08-10,Farmácia,75.90,\n2026-08-11,Pix recebido,,300');
    expect(rows.map((row) => row.kind)).toEqual(['expense', 'income']);
  });

  it('interpreta transações OFX', () => {
    const rows = parseOfx('<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260814120000<TRNAMT>-49.90<MEMO>PADARIA</STMTTRN>');
    expect(rows[0]).toMatchObject({ kind: 'expense', amount: 49.9, date: '2026-08-14', description: 'PADARIA' });
  });
});
