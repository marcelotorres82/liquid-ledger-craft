import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getIncomeIcon, getExpenseIcon } from "@/lib/transactionIcons";
import { parseExpenseDescription } from "@/lib/expenseMeta";
import { formatCurrency, formatDate } from "@/lib/format";
import { useFinanceStore } from "@/store/financeStore";
import type { Receita, Despesa } from "@/types/finance";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

interface TransactionRow {
  id: string;
  name: string;
  desc: string;
  value: number;
  income: boolean;
  date: string;
}

export const TransactionsCard = () => {
  const receitasFixas = useFinanceStore((state) => state.receitasFixas);
  const receitasVariaveis = useFinanceStore((state) => state.receitasVariaveis);
  const despesasFixas = useFinanceStore((state) => state.despesasFixas);
  const despesasAvulsas = useFinanceStore((state) => state.despesasAvulsas);
  const despesasParceladas = useFinanceStore((state) => state.despesasParceladas);

  // Combine and sort transactions
  const transactions: TransactionRow[] = [
    ...receitasFixas.map((r: Receita) => ({
      id: `rf-${r.id}`,
      name: r.descricao,
      desc: `Receita fixa · ${formatDate(r.data_registro)}`,
      value: Number(r.valor),
      income: true,
      date: r.data_registro,
    })),
    ...receitasVariaveis.map((r: Receita) => ({
      id: `rv-${r.id}`,
      name: r.descricao,
      desc: `Receita variável · ${formatDate(r.data_registro)}`,
      value: Number(r.valor),
      income: true,
      date: r.data_registro,
    })),
    ...despesasFixas.map((d: Despesa) => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        id: `df-${d.id}`,
        name: parsed.description,
        desc: `Despesa fixa · ${formatDate(d.data_inicio)}`,
        value: Number(d.valor_parcela),
        income: false,
        date: d.data_inicio,
      };
    }),
    ...despesasAvulsas.map((d: Despesa) => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        id: `da-${d.id}`,
        name: parsed.description,
        desc: `Despesa avulsa · ${formatDate(d.data_inicio)}`,
        value: Number(d.valor_parcela),
        income: false,
        date: d.data_inicio,
      };
    }),
    ...despesasParceladas.map((d: Despesa) => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        id: `dp-${d.id}-${d.parcela_atual || 0}`,
        name: parsed.description,
        desc: `Parcelada ${d.parcela_atual || 1}/${d.parcelas_total || 1} · ${formatDate(d.data_inicio)}`,
        value: Number(d.valor_parcela_mes ?? d.valor_parcela),
        income: false,
        date: d.data_inicio,
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition, delay: 0.4 }}
      className="glass-card rounded-3xl p-6 sm:p-8"
    >
      <h3 className="text-lg font-semibold tracking-tight mb-6">
        Movimentações recentes
      </h3>

      <div className="space-y-1">
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma movimentação no período
          </p>
        )}
        
        {transactions.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transition, delay: 0.45 + i * 0.04 }}
            className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                {t.income ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
            <p className={`text-sm font-semibold tabular ${t.income ? "text-success" : "text-foreground"}`}>
              {t.income ? "+ " : "- "}{formatCurrency(t.value)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
