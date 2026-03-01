import { type WheelEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingDown, TrendingUp } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import GlassCard from '@/components/GlassCard';
import AnimatedNumber from '@/components/AnimatedNumber';
import { formatCurrency, getShortMonthName } from '@/lib/format';
import {
  EXPENSE_CATEGORIES,
  getExpenseCategoryMeta,
  parseExpenseDescription,
  type ExpenseCategory,
} from '@/lib/expenseMeta';
import { cn } from '@/lib/utils';
import { getDespesas } from '@/services/api';
import { useFinanceStore } from '@/store/financeStore';
import type { DespesasResponse } from '@/types/finance';

interface AnalyticsProps {
  onLogout: () => void;
}

interface CategoryBreakdownItem {
  key: ExpenseCategory;
  label: string;
  value: number;
  pct: number;
  color: string;
}

function sumByCategory(data: DespesasResponse | undefined, category: ExpenseCategory): number {
  if (!data) return 0;

  const rows = [
    ...data.despesas_fixas.map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: Number(item.valor_parcela || 0),
    })),
    ...data.despesas_avulsas.map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: Number(item.valor_parcela || 0),
    })),
    ...data.despesas_parceladas.map((item) => ({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: Number(item.valor_parcela_mes ?? item.valor_parcela),
    })),
  ];

  return rows.reduce((sum, row) => {
    const parsed = parseExpenseDescription(row.descricao, row.tipo);
    return parsed.category === category ? sum + Number(row.valor || 0) : sum;
  }, 0);
}

const Analytics = ({ onLogout }: AnalyticsProps) => {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const despesasFixas = useFinanceStore((state) => state.despesasFixas);
  const despesasAvulsas = useFinanceStore((state) => state.despesasAvulsas);
  const despesasParceladas = useFinanceStore((state) => state.despesasParceladas);

  const receitas = Number(dashboard?.receitas.total || 0);
  const despesas = Number(dashboard?.despesas.total || 0);
  const saldo = Number(dashboard?.balanco || 0);
  const savingsRate = receitas > 0 ? (saldo / receitas) * 100 : 0;

  const monthlyTrend = (dashboard?.caixinhas?.historico || []).map((item) => ({
    month: `${getShortMonthName(item.mes)}/${String(item.ano).slice(-2)}`,
    income: Number(item.receitas || 0),
    expenses: Number(item.despesas || 0),
  }));

  const maxVal = monthlyTrend.length
    ? Math.max(...monthlyTrend.map((item) => Math.max(item.income, item.expenses)), 1)
    : 1;

  const currentMonthCategoryBreakdown = useMemo<CategoryBreakdownItem[]>(() => {
    const rows = [
      ...despesasFixas.map((item) => ({
        tipo: item.tipo,
        descricao: item.descricao,
        valor: Number(item.valor_parcela || 0),
      })),
      ...despesasAvulsas.map((item) => ({
        tipo: item.tipo,
        descricao: item.descricao,
        valor: Number(item.valor_parcela || 0),
      })),
      ...despesasParceladas.map((item) => ({
        tipo: item.tipo,
        descricao: item.descricao,
        valor: Number(item.valor_parcela_mes ?? item.valor_parcela),
      })),
    ];

    const totals = new Map<ExpenseCategory, number>();
    EXPENSE_CATEGORIES.forEach((item) => totals.set(item.key, 0));

    rows.forEach((row) => {
      const parsed = parseExpenseDescription(row.descricao, row.tipo);
      const current = totals.get(parsed.category) || 0;
      totals.set(parsed.category, current + Number(row.valor || 0));
    });

    const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

    return EXPENSE_CATEGORIES.map((meta) => {
      const value = totals.get(meta.key) || 0;
      return {
        key: meta.key,
        label: meta.label,
        value,
        pct: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
        color: meta.color,
      };
    });
  }, [despesasFixas, despesasAvulsas, despesasParceladas]);

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('contas_fixas');
  const [yearlyDataset, setYearlyDataset] = useState<DespesasResponse[]>([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [yearlyError, setYearlyError] = useState('');

  const handleCategoryWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaY;
  };

  useEffect(() => {
    if (!currentMonthCategoryBreakdown.some((item) => item.key === selectedCategory && item.value > 0)) {
      const fallback = currentMonthCategoryBreakdown.find((item) => item.value > 0)?.key || 'contas_fixas';
      setSelectedCategory(fallback);
    }
  }, [currentMonthCategoryBreakdown, selectedCategory]);

  useEffect(() => {
    let active = true;
    setYearlyLoading(true);
    setYearlyError('');

    Promise.all(
      Array.from({ length: 12 }, (_, index) => getDespesas(index + 1, currentYear))
    )
      .then((responses) => {
        if (!active) return;
        setYearlyDataset(responses);
      })
      .catch((error) => {
        if (!active) return;
        setYearlyDataset([]);
        setYearlyError(
          error instanceof Error ? error.message : 'Não foi possível carregar os gastos anuais.'
        );
      })
      .finally(() => {
        if (active) {
          setYearlyLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentYear]);

  const categoryTimeline = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const value = sumByCategory(yearlyDataset[index], selectedCategory);
        return {
          month,
          label: getShortMonthName(month),
          value,
        };
      }),
    [selectedCategory, yearlyDataset]
  );

  const categoryAnnualTotal = categoryTimeline.reduce((sum, item) => sum + item.value, 0);
  const categoryCurrentMonthTotal = categoryTimeline.find((item) => item.month === currentMonth)?.value || 0;
  const activeMonths = categoryTimeline.filter((item) => item.value > 0);
  const averageActiveMonth = activeMonths.length > 0 ? categoryAnnualTotal / activeMonths.length : 0;
  const peakMonth = categoryTimeline.reduce(
    (max, item) => (item.value > max.value ? item : max),
    { month: 1, label: getShortMonthName(1), value: 0 }
  );
  const quarterlyBreakdown = [
    {
      id: 'Q1',
      value: categoryTimeline.filter((item) => item.month <= 3).reduce((sum, item) => sum + item.value, 0),
    },
    {
      id: 'Q2',
      value: categoryTimeline.filter((item) => item.month >= 4 && item.month <= 6).reduce((sum, item) => sum + item.value, 0),
    },
    {
      id: 'Q3',
      value: categoryTimeline.filter((item) => item.month >= 7 && item.month <= 9).reduce((sum, item) => sum + item.value, 0),
    },
    {
      id: 'Q4',
      value: categoryTimeline.filter((item) => item.month >= 10).reduce((sum, item) => sum + item.value, 0),
    },
  ];
  const quarterMax = Math.max(...quarterlyBreakdown.map((item) => item.value), 1);
  const selectedMeta = getExpenseCategoryMeta(selectedCategory);

  return (
    <PageContainer title="Análise" subtitle="Visão analítica das suas finanças" onLogout={onLogout}>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <GlassCard delay={0.1} className="text-center p-3">
          <TrendingUp className="w-5 h-5 text-income mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Receitas</p>
          <p className="text-subhead font-semibold text-foreground">{formatCurrency(receitas)}</p>
        </GlassCard>

        <GlassCard delay={0.15} className="text-center p-3">
          <TrendingDown className="w-5 h-5 text-expense mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Despesas</p>
          <p className="text-subhead font-semibold text-foreground">{formatCurrency(despesas)}</p>
        </GlassCard>

        <GlassCard delay={0.2} className="text-center p-3">
          <Target className="w-5 h-5 text-savings mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Poupança</p>
          <p className="text-subhead font-semibold text-savings">
            <AnimatedNumber value={savingsRate} suffix="%" decimals={0} />
          </p>
        </GlassCard>
      </div>

      <h2 className="text-title-3 text-foreground mb-3">Tendência mensal</h2>
      <GlassCard delay={0.25} className="mb-6">
        {monthlyTrend.length === 0 ? (
          <p className="text-subhead text-muted-foreground">Sem histórico suficiente para exibir tendência.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2 h-36">
              {monthlyTrend.map((item, index) => {
                const incomeHeight = Math.max(4, (item.income / maxVal) * 100);
                const expenseHeight = Math.max(4, (item.expenses / maxVal) * 100);

                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 w-full h-28">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${incomeHeight}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                        className="flex-1 gradient-income rounded-t-lg min-h-[4px]"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${expenseHeight}%` }}
                        transition={{ duration: 0.6, delay: 0.35 + index * 0.05 }}
                        className="flex-1 gradient-expense rounded-t-lg min-h-[4px] opacity-70"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full gradient-income" />
                <span className="text-caption text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full gradient-expense opacity-70" />
                <span className="text-caption text-muted-foreground">Despesas</span>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      <h2 className="text-title-3 text-foreground mb-3">Distribuição de despesas</h2>
      <GlassCard delay={0.35}>
        <div
          className="chip-scroller mb-4 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide touch-pan-x overscroll-x-contain"
          onWheel={handleCategoryWheel}
        >
          <div className="inline-flex min-w-max gap-2 pr-1 snap-x snap-mandatory">
            {currentMonthCategoryBreakdown.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedCategory(item.key)}
                className={cn(
                  'glass-subtle category-chip shrink-0 inline-flex items-center gap-2 tap-highlight-none snap-start',
                  selectedCategory === item.key && 'category-chip-active'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-caption text-foreground whitespace-nowrap">{item.label}</span>
                <span className="text-caption text-muted-foreground">{item.pct}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-subtle rounded-2xl p-3 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-caption uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Categoria selecionada
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMeta.icon}</span>
                <p className="text-title-3 text-foreground break-words">{selectedMeta.label}</p>
              </div>
            </div>

            <div className="text-right ml-auto shrink-0">
              <p className="text-caption text-muted-foreground">Total em {currentYear}</p>
              <p className="text-title-3 text-expense whitespace-nowrap text-[clamp(1.35rem,5.2vw,1.75rem)] leading-tight">
                {formatCurrency(categoryAnnualTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-caption uppercase tracking-[0.13em] text-muted-foreground">Resumo anual inteligente</p>
          </div>

          {yearlyLoading ? (
            <p className="text-subhead text-muted-foreground">Carregando série anual...</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary/50 border border-border/60 p-2">
                  <p className="text-caption text-muted-foreground">Mês atual</p>
                  <p className="text-foreground font-semibold leading-tight whitespace-nowrap text-[clamp(0.9rem,4vw,1rem)]">
                    {formatCurrency(categoryCurrentMonthTotal)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/50 border border-border/60 p-2">
                  <p className="text-caption text-muted-foreground">Média ativa</p>
                  <p className="text-foreground font-semibold leading-tight whitespace-nowrap text-[clamp(0.9rem,4vw,1rem)]">
                    {formatCurrency(averageActiveMonth)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/50 border border-border/60 p-2 col-span-2 sm:col-span-1">
                  <p className="text-caption text-muted-foreground">Pico ({peakMonth.label})</p>
                  <p className="text-foreground font-semibold leading-tight whitespace-nowrap text-[clamp(0.9rem,4vw,1rem)]">
                    {formatCurrency(peakMonth.value)}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {quarterlyBreakdown.map((quarter) => (
                  <div key={quarter.id} className="flex items-center gap-2.5">
                    <span className="text-caption text-muted-foreground w-7 shrink-0">{quarter.id}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-secondary/70 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${quarter.value > 0 ? Math.max(4, (quarter.value / quarterMax) * 100) : 0}%`,
                        }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="h-full rounded-full gradient-expense"
                      />
                    </div>
                    <span className="text-caption text-foreground w-[6.4rem] sm:w-24 text-right whitespace-nowrap">
                      {formatCurrency(quarter.value)}
                    </span>
                  </div>
                ))}
              </div>

              {activeMonths.length > 0 && (
                <p className="text-caption text-muted-foreground">
                  Meses com gasto: {activeMonths.length} de 12
                </p>
              )}
              {activeMonths.length === 0 && (
                <p className="text-caption text-muted-foreground">
                  Não há gastos registrados para esta categoria em {currentYear}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {currentMonthCategoryBreakdown.every((item) => item.value <= 0) && (
            <p className="text-subhead text-muted-foreground">Sem despesas para análise no período selecionado.</p>
          )}

          {currentMonthCategoryBreakdown
            .filter((item) => item.value > 0)
            .map((category, index) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                <span className="text-subhead text-foreground flex-1">{category.label}</span>
                <span className="text-subhead font-medium text-foreground">{formatCurrency(category.value)}</span>
                <span className="text-caption text-muted-foreground w-10 text-right">{category.pct}%</span>
              </motion.div>
            ))}
        </div>

        {yearlyError && <p className="text-caption text-destructive mt-4">{yearlyError}</p>}
      </GlassCard>
    </PageContainer>
  );
};

export default Analytics;
