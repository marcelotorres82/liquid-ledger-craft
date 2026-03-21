import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { parseExpenseDescription } from "@/lib/expenseMeta";
import { formatCurrency, formatDate } from "@/lib/format";
import { getExpenseIcon } from "@/lib/transactionIcons";
import { useFinanceStore } from "@/store/financeStore";
import type { Despesa } from "@/types/finance";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

interface AgendaItem {
  id: string;
  title: string;
  dueDate: Date;
  daysDiff: number;
  overdue: boolean;
  amount: number;
  typeLabel: string;
  raw: Despesa;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getLastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function getDueDate(expense: Despesa, month: number, year: number): Date {
  const sourceDate = new Date(`${expense.data_inicio}T00:00:00`);

  if (expense.tipo === "avulsa") {
    return sourceDate;
  }

  const lastDay = getLastDayOfMonth(month, year);
  const day = Math.min(sourceDate.getDate(), lastDay);
  return new Date(year, month - 1, day);
}

function getTypeLabel(expense: Despesa): string {
  if (expense.tipo === "parcelada") {
    const atual = expense.parcela_atual || 1;
    const total = expense.parcelas_total || 1;
    return `Parcelada ${atual}/${total}`;
  }

  return expense.tipo === "fixa" ? "Fixa" : "Avulsa";
}

function getStatusLabel(daysDiff: number, dueDate: Date): string {
  const dateLabel = formatDate(dueDate.toISOString().slice(0, 10));

  if (daysDiff < 0) {
    const lateDays = Math.abs(daysDiff);
    return `${lateDays} ${lateDays === 1 ? "dia" : "dias"} de atraso · ${dateLabel}`;
  }

  if (daysDiff === 0) {
    return `Vence hoje · ${dateLabel}`;
  }

  if (daysDiff === 1) {
    return `Vence amanhã · ${dateLabel}`;
  }

  return `Vence em ${daysDiff} dias · ${dateLabel}`;
}

export const AgendaCard = () => {
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const despesasFixas = useFinanceStore((state) => state.despesasFixas);
  const despesasAvulsas = useFinanceStore((state) => state.despesasAvulsas);
  const despesasParceladas = useFinanceStore((state) => state.despesasParceladas);

  const bills = useMemo(() => {
    const today = startOfDay(new Date());

    return [...despesasFixas, ...despesasAvulsas, ...despesasParceladas]
      .filter((expense) => !expense.paga)
      .map((expense) => {
        const parsed = parseExpenseDescription(expense.descricao, expense.tipo);
        const dueDate = startOfDay(getDueDate(expense, currentMonth, currentYear));
        const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: `${expense.tipo}-${expense.id}`,
          title: parsed.description,
          dueDate,
          daysDiff,
          overdue: daysDiff < 0,
          amount: Number(expense.valor_parcela_mes ?? expense.valor_parcela ?? 0),
          typeLabel: getTypeLabel(expense),
          raw: expense,
        } satisfies AgendaItem;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 6);
  }, [currentMonth, currentYear, despesasFixas, despesasAvulsas, despesasParceladas]);

  const summary = useMemo(() => {
    const pending = bills.reduce((sum, item) => sum + item.amount, 0);
    const overdue = bills.filter((item) => item.daysDiff < 0).length;
    const upTo3Days = bills.filter((item) => item.daysDiff >= 0 && item.daysDiff <= 3).length;
    const upTo7Days = bills.filter((item) => item.daysDiff >= 0 && item.daysDiff <= 7).length;

    return { pending, overdue, upTo3Days, upTo7Days };
  }, [bills]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition, delay: 0.2 }}
      className="glass-card rounded-4xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold tracking-tight">Agenda de vencimentos</h3>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="glass-card-static rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Pendente</p>
          <p className="text-sm font-semibold tabular">{formatCurrency(summary.pending)}</p>
        </div>
        <div className="glass-card-static rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Atrasadas</p>
          <p className="text-sm font-semibold tabular text-destructive">{summary.overdue}</p>
        </div>
        <div className="glass-card-static rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Até 3 dias</p>
          <p className="text-sm font-semibold tabular text-warning">{summary.upTo3Days}</p>
        </div>
        <div className="glass-card-static rounded-2xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Até 7 dias</p>
          <p className="text-sm font-semibold tabular">{summary.upTo7Days}</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="glass-card-static rounded-2xl p-4 flex items-start gap-3 border border-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Sem contas pendentes</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todas as despesas do período atual estão pagas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {bills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...transition, delay: 0.3 + index * 0.05 }}
              className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                  {getExpenseIcon(bill.raw.descricao, bill.raw.tipo)}
                </div>
                <div>
                  <p className="text-sm font-medium">{bill.title}</p>
                  <p className={`text-xs ${bill.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {getStatusLabel(bill.daysDiff, bill.dueDate)} · {bill.typeLabel}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold tabular">- {formatCurrency(bill.amount)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
