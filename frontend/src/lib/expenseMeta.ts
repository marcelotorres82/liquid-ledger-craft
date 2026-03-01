import type { DespesaTipo } from '@/types/finance';

export type ExpenseCategory =
  | 'contas_fixas'
  | 'contas_variaveis'
  | 'alimentacao'
  | 'compras'
  | 'entretenimento';

export interface ExpenseCategoryMeta {
  key: ExpenseCategory;
  label: string;
  color: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  { key: 'contas_fixas', label: 'Contas fixas', color: '#3B82F6', icon: '🏠' },
  { key: 'contas_variaveis', label: 'Contas variáveis', color: '#8B5CF6', icon: '📄' },
  { key: 'alimentacao', label: 'Alimentação', color: '#F59E0B', icon: '🍽️' },
  { key: 'compras', label: 'Compras', color: '#EC4899', icon: '🛍️' },
  { key: 'entretenimento', label: 'Entretenimento', color: '#14B8A6', icon: '🎬' },
];

const CATEGORY_PREFIX_REGEX =
  /^\[cat:(contas_fixas|contas_variaveis|alimentacao|compras|entretenimento)\]\s*/i;

function normalizeCategoria(raw?: string | null): ExpenseCategory | null {
  if (!raw) return null;
  const value = String(raw).trim().toLowerCase();
  if (
    value === 'contas_fixas' ||
    value === 'contas_variaveis' ||
    value === 'alimentacao' ||
    value === 'compras' ||
    value === 'entretenimento'
  ) {
    return value;
  }
  return null;
}

function fallbackCategoryByTipo(tipo: DespesaTipo): ExpenseCategory {
  if (tipo === 'fixa') return 'contas_fixas';
  if (tipo === 'parcelada') return 'compras';
  return 'contas_variaveis';
}

export function stripExpenseCategoryPrefix(rawDescription: string): string {
  return String(rawDescription || '').replace(CATEGORY_PREFIX_REGEX, '').trim();
}

export function parseExpenseDescription(
  rawDescription: string,
  tipoFallback: DespesaTipo = 'avulsa'
): { description: string; category: ExpenseCategory } {
  const text = String(rawDescription || '').trim();
  const matched = text.match(CATEGORY_PREFIX_REGEX);
  const explicitCategory = normalizeCategoria(matched?.[1]);
  const description = stripExpenseCategoryPrefix(text);

  return {
    description: description || 'Sem descrição',
    category: explicitCategory || fallbackCategoryByTipo(tipoFallback),
  };
}

export function encodeExpenseDescription(description: string, category: ExpenseCategory): string {
  const cleanDescription = stripExpenseCategoryPrefix(description);
  return `[cat:${category}] ${cleanDescription}`.trim();
}

export function getExpenseCategoryMeta(category: ExpenseCategory): ExpenseCategoryMeta {
  return (
    EXPENSE_CATEGORIES.find((item) => item.key === category) || {
      key: 'contas_variaveis',
      label: 'Contas variáveis',
      color: '#8B5CF6',
      icon: '📄',
    }
  );
}

export function getComprasMesLabel(month: number): string {
  const mesStr = String(month).padStart(2, '0');
  return `Compras do mês ${mesStr}`;
}

export function getCategoryLabel(category: ExpenseCategory, month?: number): string {
  if (category === 'compras' && month != null) {
    return getComprasMesLabel(month);
  }
  return getExpenseCategoryMeta(category).label;
}
