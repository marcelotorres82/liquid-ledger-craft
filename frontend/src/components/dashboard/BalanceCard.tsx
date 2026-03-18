import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/lib/format";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

export const BalanceCard = () => {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);

  const receitas = Number(dashboard?.receitas.total || 0);
  const despesas = Number(dashboard?.despesas.total || 0);
  const saldo = Number(dashboard?.balanco || 0);
  const savingsRate = receitas > 0 ? (saldo / receitas) * 100 : 0;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition, delay: 0.1 }}
      className="glass-card rounded-3xl p-6 sm:p-8"
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Saldo do mês
      </p>
      <h2 className={`text-4xl sm:text-5xl font-semibold tracking-tight tabular mb-6 ${saldo >= 0 ? 'text-gradient-green' : 'text-destructive'}`}>
        {formatCurrency(saldo)}
      </h2>

      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10">
            <ArrowUpRight className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-sm font-semibold tabular">{formatCurrency(receitas)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10">
            <ArrowDownRight className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-semibold tabular">{formatCurrency(despesas)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card-static rounded-2xl p-4">
        <p className={`text-sm font-medium ${savingsRate >= 20 ? 'text-gradient-green' : savingsRate >= 0 ? 'text-warning' : 'text-destructive'}`}>
          {savingsRate >= 20 
            ? `Você poupou ${Math.round(savingsRate)}% da renda. Ótimo desempenho!`
            : savingsRate >= 0 
              ? `Você poupou ${Math.round(savingsRate)}% da renda`
              : `Você gastou ${Math.round(Math.abs(savingsRate))}% a mais do que recebeu`
          }
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {monthNames[currentMonth - 1]} de {currentYear}
        </p>
      </div>
    </motion.div>
  );
};
