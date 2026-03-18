import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowDownRight, CreditCard, Utensils, Wifi, Smartphone, Home, Zap, ShoppingBag, Car, Check } from 'lucide-react';
import { BottomNav } from '@/components/dashboard/BottomNav';
import ExpenseSheet from '@/components/ExpenseSheet';
import { getCategoryLabel, parseExpenseDescription } from '@/lib/expenseMeta';
import { formatCurrency, formatDate, toISODate, getMonthName } from '@/lib/format';
import { useFinanceStore } from '@/store/financeStore';
import type { Despesa } from '@/types/finance';

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

interface ExpensesProps {
  onLogout: () => void;
}

const getExpenseIcon = (descricao: string, tipo: string) => {
  const desc = descricao.toLowerCase();
  if (desc.includes('aluguel') || desc.includes('moradia') || desc.includes('casa')) return Home;
  if (desc.includes('cartão') || desc.includes('nubank') || desc.includes('credito')) return CreditCard;
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('compra')) return ShoppingBag;
  if (desc.includes('luz') || desc.includes('energia') || desc.includes('água') || desc.includes('gas')) return Zap;
  if (desc.includes('internet') || desc.includes('wifi') || desc.includes('telefone')) return Wifi;
  if (desc.includes('ifood') || desc.includes('comida') || desc.includes('restaurante')) return Utensils;
  if (desc.includes('celular') || desc.includes('smartphone')) return Smartphone;
  if (desc.includes('combustível') || desc.includes('gasolina') || desc.includes('uber') || desc.includes('carro')) return Car;
  return ArrowDownRight;
};

const Expenses = ({ onLogout }: ExpensesProps) => {
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const despesasFixas = useFinanceStore((state) => state.despesasFixas);
  const despesasAvulsas = useFinanceStore((state) => state.despesasAvulsas);
  const despesasParceladas = useFinanceStore((state) => state.despesasParceladas);
  const addDespesa = useFinanceStore((state) => state.addDespesa);
  const editDespesa = useFinanceStore((state) => state.editDespesa);
  const removeDespesa = useFinanceStore((state) => state.removeDespesa);
  const isMutating = useFinanceStore((state) => state.isMutating);
  const error = useFinanceStore((state) => state.error);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);

  // Handler para toggle de pagamento
  const handleTogglePagamento = async (item: typeof allExpenses[0]) => {
    const novaDataPagamento = item.paga ? null : new Date().toISOString().split('T')[0];
    await editDespesa(item.id, {
      descricao: item.descricao,
      valor_parcela: item.valor_parcela,
      tipo: item.tipo,
      data_inicio: item.data_inicio,
      paga: !item.paga,
      data_pagamento: novaDataPagamento,
    });
  };

  const allExpenses = useMemo(() => {
    const fixas = despesasFixas.map(d => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        ...d,
        title: parsed.description,
        categoryLabel: getCategoryLabel(parsed.category, currentMonth),
        valor_exibicao: Number(d.valor_parcela || 0),
        detalhe: '',
        tipo_exibicao: 'Fixa',
      };
    });
    
    const avulsas = despesasAvulsas.map(d => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        ...d,
        title: parsed.description,
        categoryLabel: getCategoryLabel(parsed.category, currentMonth),
        valor_exibicao: Number(d.valor_parcela || 0),
        detalhe: '',
        tipo_exibicao: 'Avulsa',
      };
    });
    
    const parceladas = despesasParceladas.map(d => {
      const parsed = parseExpenseDescription(d.descricao, d.tipo);
      return {
        ...d,
        title: parsed.description,
        categoryLabel: getCategoryLabel(parsed.category, currentMonth),
        valor_exibicao: Number(d.valor_parcela_mes ?? d.valor_parcela),
        detalhe: d.parcela_atual && d.parcelas_total ? `Parcela ${d.parcela_atual}/${d.parcelas_total}` : '',
        tipo_exibicao: 'Parcelada',
      };
    });
    
    return [...fixas, ...avulsas, ...parceladas].sort(
      (a, b) => new Date(`${b.data_inicio}T00:00:00`).getTime() - new Date(`${a.data_inicio}T00:00:00`).getTime()
    );
  }, [despesasFixas, despesasAvulsas, despesasParceladas, currentMonth]);

  const total = allExpenses.reduce((sum, e) => sum + e.valor_exibicao, 0);

  const handleSave = async (payload: {
    descricao: string;
    valor_parcela: number;
    tipo: 'fixa' | 'avulsa' | 'parcelada';
    data_inicio: string;
    paga?: boolean;
    data_pagamento?: string | null;
    parcelas_total?: number;
    valor_primeira_parcela?: number;
  }) => {
    if (editing) {
      await editDespesa(editing.id, payload);
      setEditing(null);
      return;
    }
    await addDespesa(payload);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja remover esta despesa?')) return;
    await removeDespesa(id);
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
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Despesas</h1>
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
              Total de despesas
            </p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight tabular text-destructive mb-4">
              {formatCurrency(total)}
            </h2>
            <div className="glass-card-static rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {allExpenses.length} {allExpenses.length === 1 ? 'despesa' : 'despesas'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Expenses List */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...transition, delay: 0.2 }}
            className="glass-card rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight">Todas as despesas</h3>
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
              {allExpenses.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma despesa cadastrada.
                </p>
              )}

              {allExpenses.map((item, i) => {
                const Icon = getExpenseIcon(item.descricao, item.tipo);
                return (
                  <motion.div
                    key={`${item.tipo}-${item.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...transition, delay: 0.25 + i * 0.04 }}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                        <Icon className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.tipo_exibicao} · {formatDate(item.data_inicio)}
                          {item.detalhe && ` · ${item.detalhe}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePagamento(item)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          item.paga 
                            ? 'bg-success/20 text-success border border-success/30' 
                            : 'bg-secondary text-muted-foreground border border-border hover:bg-secondary/80'
                        }`}
                        title={item.paga ? 'Pago' : 'Marcar como pago'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <p className={`text-sm font-semibold tabular ${item.paga ? 'text-success line-through opacity-60' : 'text-foreground'}`}>
                        - {formatCurrency(item.valor_exibicao)}
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

          {/* Parcelamentos */}
          {despesasParceladas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...transition, delay: 0.3 }}
              className="glass-card rounded-3xl p-6 sm:p-8"
            >
              <h3 className="text-lg font-semibold tracking-tight mb-4">Parcelamentos ativos</h3>
              <div className="space-y-4">
                {despesasParceladas.map((item) => {
                  const parsed = parseExpenseDescription(item.descricao, item.tipo);
                  const progress = item.parcela_atual && item.parcelas_total 
                    ? (item.parcela_atual / item.parcelas_total) * 100 
                    : 0;
                  return (
                    <div key={`parcela-${item.id}`} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{parsed.description}</p>
                        <p className="text-sm text-destructive font-semibold">
                          {formatCurrency(Number(item.valor_parcela_mes ?? item.valor_parcela))}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Parcela {item.parcela_atual || 1} de {item.parcelas_total || 1}
                      </p>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <BottomNav />

      <ExpenseSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialDate={toISODate(currentMonth, currentYear)}
        referenceMonth={currentMonth}
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

export default Expenses;
