import type { SmartTransaction } from '@/types/finance';

function normalizeHeader(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseAmount(value: string) {
  const clean = String(value || '').replace(/[^\d,.-]/g, '');
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  return Number(normalized) || 0;
}

function parseDate(value: string) {
  const text = String(value || '').trim();
  const br = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(text);
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  }
  const iso = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(text);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  return new Date().toISOString().slice(0, 10);
}

function transaction(description: string, value: number, date: string): SmartTransaction {
  const kind = value >= 0 ? 'income' : 'expense';
  return {
    kind, amount: Math.abs(value), description: description || 'Lançamento importado',
    categoryKey: kind === 'income' ? 'outras_receitas' : 'compras',
    categoryLabel: kind === 'income' ? 'Outras receitas' : 'Compras',
    recordType: kind === 'income' ? 'variavel' : 'avulsa', date,
    merchant: '', account: '', installments: 1, paid: kind === 'expense', confidence: 0.55,
    notes: 'Importado de extrato', source: 'import',
  };
}

export function parseCsv(content: string): SmartTransaction[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const headers = lines[0].split(delimiter).map(normalizeHeader);
  const find = (...names: string[]) => headers.findIndex((header) => names.some((name) => header.includes(name)));
  const dateIndex = find('data', 'date');
  const descriptionIndex = find('descricao', 'historico', 'memo', 'description', 'estabelecimento');
  const amountIndex = find('valor', 'amount', 'quantia');
  const debitIndex = find('debito', 'debit');
  const creditIndex = find('credito', 'credit');

  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
    let value = amountIndex >= 0 ? parseAmount(cells[amountIndex]) : 0;
    if (!value && debitIndex >= 0) value = -Math.abs(parseAmount(cells[debitIndex]));
    if (!value && creditIndex >= 0) value = Math.abs(parseAmount(cells[creditIndex]));
    return transaction(cells[descriptionIndex] || '', value, parseDate(cells[dateIndex] || ''));
  }).filter((item) => item.amount > 0);
}

export function parseOfx(content: string): SmartTransaction[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi) || [];
  const tag = (block: string, name: string) => new RegExp(`<${name}>([^<\r\n]+)`, 'i').exec(block)?.[1]?.trim() || '';
  return blocks.map((block) => {
    const value = parseAmount(tag(block, 'TRNAMT'));
    const dateRaw = tag(block, 'DTPOSTED');
    const date = /^\d{8}/.test(dateRaw) ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}` : parseDate(dateRaw);
    return transaction(tag(block, 'MEMO') || tag(block, 'NAME'), value, date);
  }).filter((item) => item.amount > 0);
}

export function parseFinancialFile(filename: string, content: string) {
  const format = filename.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv';
  return { format, transactions: format === 'ofx' ? parseOfx(content) : parseCsv(content) };
}
