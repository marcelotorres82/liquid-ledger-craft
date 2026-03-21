import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useFinanceStore } from "@/store/financeStore";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

const projectionWindows = [
  { label: "30 dias", multiplier: 1 },
  { label: "60 dias", multiplier: 2 },
  { label: "90 dias", multiplier: 3 },
];

export const ProjectionCard = () => {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const receitasFixas = useFinanceStore((state) => state.receitasFixas);
  const despesasFixas = useFinanceStore((state) => state.despesasFixas);
  const despesasParceladas = useFinanceStore((state) => state.despesasParceladas);

  const recurringIncome = useMemo(
    () => receitasFixas.reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [receitasFixas]
  );

  const recurringExpenses = useMemo(
    () =>
      [...despesasFixas, ...despesasParceladas].reduce(
        (sum, item) => sum + Number(item.valor_parcela_mes ?? item.valor_parcela ?? 0),
        0
      ),
    [despesasFixas, despesasParceladas]
  );

  const currentBalance = Number(dashboard?.balanco || 0);
  const monthlyRecurringBalance = recurringIncome - recurringExpenses;

  const projections = projectionWindows.map((window) => ({
    ...window,
    value: currentBalance + monthlyRecurringBalance * window.multiplier,
  }));

  const trendPositive = monthlyRecurringBalance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition, delay: 0.3 }}
      className="glass-card rounded-4xl p-6 sm:p-8"
    >
      <h3 className="text-lg font-semibold tracking-tight mb-1">Projeção de saldo</h3>
      <p className="text-xs text-muted-foreground mb-6">30, 60 e 90 dias com base no fluxo recorrente</p>

      <div className="flex items-center gap-2 mb-6">
        {trendPositive ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
        <span className={`text-sm font-medium ${trendPositive ? "text-success" : "text-destructive"}`}>
          {trendPositive ? "Tendência positiva" : "Tendência de queda"}
        </span>
        <span className={`text-sm font-semibold tabular ${trendPositive ? "text-gradient-gold" : "text-destructive"}`}>
          {monthlyRecurringBalance >= 0 ? "+" : "-"} {formatCurrency(Math.abs(monthlyRecurringBalance))}/mês
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {projections.map((projection, index) => (
          <motion.div
            key={projection.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.4 + index * 0.08 }}
            className="glass-card-static rounded-2xl p-4 text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{projection.label}</p>
            <p className={`text-base font-semibold tabular ${projection.value >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatCurrency(projection.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
        Receita fixa: {formatCurrency(recurringIncome)} · Despesas recorrentes: {formatCurrency(recurringExpenses)}
      </p>
    </motion.div>
  );
};
