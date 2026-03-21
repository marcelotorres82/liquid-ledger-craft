import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowUpRight, Briefcase, Laptop, TrendingUp, Gift, DollarSign } from 'lucide-react';
import IncomeSheet from '@/components/IncomeSheet';
import { formatCurrency, formatDate, toISODate, getMonthName } from '@/lib/format';
import { useFinanceStore } from '@/store/financeStore';
import type { Receita } from '@/types/finance';

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

interface IncomeProps {
  onLogout: () => void;
}

const getIncomeIcon = (descricao: string) => {
  const desc = descricao.toLowerCase();
  if (desc.includes('salário') || desc.includes('salario')) return Briefcase;
  if (desc.includes('freelance') || desc.includes('projeto')) return Laptop;
  if (desc.includes('dividendo') || desc.includes('rendimento')) return TrendingUp;
  if (desc.includes('cashback') || desc.includes('bonus') || desc.includes('bônus')) return Gift;
  if (desc.includes('aluguel') || desc.includes('venda')) return DollarSign;
  return ArrowUpRight;
};

const Income = ({ onLogout }: IncomeProps) => {
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const receitasFixas = useFinanceStore((state) => state.receitasFixas);
  const receitasVariaveis = useFinanceStore((state) => state.receitasVariaveis);
  const addReceita = useFinanceStore((state) => state.addReceita);
  const editReceita = useFinanceStore((state) => state.editReceita);
  const removeReceita = useFinanceStore((state) => state.removeReceita);
  const isMutating = useFinanceStore((state) => state.isMutating);
  const error = useFinanceStore((state) => state.error);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);

  const entries = useMemo(
    () =>
      [...receitasFixas, ...receitasVariaveis]
        .sort(
          (a, b) =>
            new Date(`${b.data_registro}T00:00:00`).getTime() -
            new Date(`${a.data_registro}T00:00:00`).getTime()
        ),
    [receitasFixas, receitasVariaveis]
  );

  const total = entries.reduce((sum, entry) => sum + Number(entry.valor || 0), 0);

  const categories = useMemo(() => {
    const fixa = receitasFixas.reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const variavel = receitasVariaveis.reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const total = fixa + variavel;
    return [
      { label: "Fixa", value: fixa, pct: total > 0 ? Math.round((fixa / total) * 100) : 0 },
      { label: "Variável", value: variavel, pct: total > 0 ? Math.round((variavel / total) * 100) : 0 },
    ];
  }, [receitasFixas, receitasVariaveis]);

  const handleSave = async (payload: {
    descricao: string;
    valor: number;
    tipo: 'fixa' | 'variavel';
    data_registro: string;
  }) => {
    if (editing) {
      await editReceita(editing.id, payload);
      setEditing(null);
      return;
    }
    await addReceita(payload);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja remover esta receita?')) return;
    await removeReceita(id);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-lg px-4 pt-12 sm:pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Receitas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getMonthName(currentMonth)} {currentYear}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </motion.div>

        <div className="space-y-4">
          {/* Total Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...transition, delay: 0.1 }}
            className="glass-card rounded-3xl p-6 sm:p-8"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Total de receitas
            </p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight tabular text-gradient-green mb-4">
              {formatCurrency(total)}
            </h2>
            <div className="glass-card-static rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <p className="text-sm font-medium text-success">
                  {entries.length} {entries.length === 1 ? 'lançamento' : 'lançamentos'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Categories Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...transition, delay: 0.2 }}
            className="glass-card rounded-3xl p-6 sm:p-8"
          >
            <h3 className="text-lg font-semibold tracking-tight mb-5">Por categoria</h3>
            <div className="space-y-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...transition, delay: 0.25 + i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <span className="text-sm tabular text-muted-foreground">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-success"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: [0.2, 0, 0, 1] }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Income List */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...transition, delay: 0.3 }}
            className="glass-card rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight">Detalhamento</h3>
              <button
                onClick={() => {
                  setEditing(null);
                  setSheetOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            <div className="space-y-1">
              {entries.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma receita cadastrada.
                </p>
              )}

              {entries.map((item, i) => {
                const Icon = getIncomeIcon(item.descricao);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...transition, delay: 0.35 + i * 0.04 }}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
                        <Icon className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.tipo === 'fixa' ? 'Fixa' : 'Variável'} · {formatDate(item.data_registro)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-sm font-semibold tabular text-success">
                        + {formatCurrency(item.valor)}
                      </p>
                      <button
                        onClick={() => {
                          setEditing(item);
                          setSheetOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Excluir
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <IncomeSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialDate={toISODate(currentMonth, currentYear)}
        editing={editing}
      />

      {isMutating && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-caption text-muted-foreground bg-card/80 px-3 py-1.5 rounded-xl border border-border">
          Salvando alterações...
        </p>
      )}

      {error && (
        <p className="fixed bottom-20 left-1/2 -translate-x-1/2 text-caption text-destructive bg-card/80 px-3 py-1.5 rounded-xl border border-border">
          {error}
        </p>
      )}
    </div>
  );
};

export default Income;
