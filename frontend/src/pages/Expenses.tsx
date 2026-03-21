import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDownRight, CreditCard, Utensils, Wifi, Smartphone, Home, Zap, ShoppingBag, Car, Check } from 'lucide-react';
import ExpenseSheet from '@/components/ExpenseSheet';
import PageContainer from '@/components/PageContainer';
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
      mes_referencia: currentMonth, 
      ano_referencia: currentYear,
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
  const totalPago = allExpenses.filter(e => e.paga).reduce((sum, e) => sum + e.valor_exibicao, 0);
  const totalPendente = total - totalPago;

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
    const dataToSave = { ...payload, mes_referencia: currentMonth, ano_referencia: currentYear };
    if (editing) {
      await editDespesa(editing.id, dataToSave);
      setEditing(null);
      return;
    }
    await addDespesa(dataToSave);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja remover esta despesa?')) return;
    await removeDespesa(id);
  };

  return (
    <PageContainer title="Despesas" onLogout={onLogout}>
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
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="glass-card-static rounded-2xl p-3 sm:p-4 border-l-2 border-l-success border-t-0 border-r-0 border-b-0 bg-success/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">Pago</p>
                <p className="text-sm sm:text-base font-bold text-success truncate">{formatCurrency(totalPago)}</p>
              </div>
              <div className="glass-card-static rounded-2xl p-3 sm:p-4 border-l-2 border-l-destructive border-t-0 border-r-0 border-b-0 bg-destructive/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">Falta Pagar</p>
                <p className="text-sm sm:text-base font-bold text-destructive truncate">{formatCurrency(totalPendente)}</p>
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
                    className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                      <Icon className="h-4 w-4 text-destructive" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.tipo_exibicao} · {formatDate(item.data_inicio)}
                        {item.detalhe && ` · ${item.detalhe}`}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTogglePagamento(item)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          item.paga 
                            ? 'bg-success/20 text-success border border-success/30' 
                            : 'bg-secondary text-muted-foreground border border-border hover:bg-secondary/80'
                        }`}
                        title={item.paga ? 'Pago' : 'Marcar como pago'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      
                      <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${item.paga ? 'text-success line-through opacity-60' : 'text-destructive'}`}>
                        - {formatCurrency(item.valor_exibicao)}
                      </p>
                      
                      <button
                        onClick={() => {
                          setEditing(item);
                          setSheetOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-destructive hover:text-destructive/80 whitespace-nowrap"
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
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium truncate flex-1 min-w-0">{parsed.description}</p>
                        <p className="text-sm text-destructive font-semibold tabular-nums whitespace-nowrap shrink-0">
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

      {/* Removed isMutating toast for instant UX */}

      {error && (
        <p className="fixed bottom-20 left-1/2 -translate-x-1/2 text-caption text-destructive bg-card/80 px-3 py-1.5 rounded-xl border border-border">
          {error}
        </p>
      )}
    </PageContainer>
  );
};

export default Expenses;
