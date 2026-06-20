import { useEffect, useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import GlassCard from '@/components/GlassCard';
import GlassProgressBar from '@/components/GlassProgressBar';
import AnimatedNumber from '@/components/AnimatedNumber';
import { getShortMonthName } from '@/lib/format';
import { useFinanceStore } from '@/store/financeStore';

interface SavingsProps {
  onLogout: () => void;
}

const emojiByCategory: Record<string, string> = {
  Casa: '🏠',
  Gastos: '💳',
  Reserva: '🛟',
  'Férias': '🏖️',
  Ferias: '🏖️',
};

const Savings = ({ onLogout }: SavingsProps) => {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const setSavedAmount = useFinanceStore((state) => state.setSavedAmount);
  const useCalculatedSavedAmount = useFinanceStore((state) => state.useCalculatedSavedAmount);
  const isMutating = useFinanceStore((state) => state.isMutating);
  const totalSaved = Number(dashboard?.caixinhas?.total_acumulado || 0);
  const goals = dashboard?.caixinhas?.categorias || [];
  const distribuicaoSaldo = dashboard?.distribuicao_saldo || [];
  const cycleStart = dashboard?.caixinhas?.inicio_ciclo;
  const savedThisMonth = Number(dashboard?.caixinhas?.guardado_mes || 0);
  const calculatedThisMonth = Number(dashboard?.caixinhas?.guardado_mes_calculado || 0);
  const isManual = Boolean(dashboard?.caixinhas?.guardado_mes_manual);
  const monthlyAdjustments = Number(dashboard?.caixinhas?.ajustes_mes || 0);
  const [editingSaved, setEditingSaved] = useState(false);
  const [savedInput, setSavedInput] = useState(String(savedThisMonth));
  const [savedError, setSavedError] = useState('');

  useEffect(() => {
    if (!editingSaved) {
      setSavedInput(String(savedThisMonth));
    }
  }, [savedThisMonth, editingSaved]);

  const saveMonthlyAmount = async () => {
    const value = Number.parseFloat(savedInput.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) {
      setSavedError('Informe um valor válido.');
      return;
    }

    setSavedError('');
    try {
      await setSavedAmount(value);
      setEditingSaved(false);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Não foi possível salvar.');
    }
  };

  const restoreCalculatedAmount = async () => {
    setSavedError('');
    try {
      await useCalculatedSavedAmount();
      setEditingSaved(false);
    } catch (error) {
      setSavedError(error instanceof Error ? error.message : 'Não foi possível restaurar.');
    }
  };

  const periodLabel =
    cycleStart && dashboard?.caixinhas?.meses_considerados
      ? `${getShortMonthName(cycleStart.mes)}/${cycleStart.ano} • ${dashboard.caixinhas.meses_considerados} meses`
      : 'Ciclo atual';

  return (
    <PageContainer title="Caixinhas" subtitle="Metas inteligentes de economia" onLogout={onLogout}>
      <GlassCard delay={0.1} className="mb-6 text-center oppo-card glass-refractive py-8">
        <p className="text-caption text-muted-foreground uppercase tracking-[0.2em] mb-2">Total acumulado</p>
        <div className="text-large-title text-foreground">
          <AnimatedNumber value={totalSaved} prefix="R$ " />
        </div>
        <p className="text-caption text-muted-foreground mt-2 opacity-80">{periodLabel}</p>
      </GlassCard>

      <GlassCard delay={0.12} className="mb-6 oppo-card glass-refractive">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground uppercase tracking-[0.14em]">
              Guardado neste mês
            </p>
            {!editingSaved ? (
              <>
                <p className="text-title-2 font-bold text-foreground mt-1">
                  R$ {savedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-caption text-muted-foreground mt-1">
                  {isManual
                    ? `Valor alterado • cálculo original: R$ ${calculatedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Calculado pelo que restou no mês'}
                </p>
                {monthlyAdjustments !== 0 && (
                  <p className="text-caption text-muted-foreground mt-2">
                    {monthlyAdjustments < 0 ? 'Retirado das caixinhas' : 'Ajuste nas caixinhas'}:{' '}
                    R$ {Math.abs(monthlyAdjustments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-subhead font-bold">R$</span>
                  <input
                    value={savedInput}
                    onChange={(event) => setSavedInput(event.target.value)}
                    inputMode="decimal"
                    className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Valor guardado neste mês"
                  />
                  <button
                    type="button"
                    onClick={saveMonthlyAmount}
                    disabled={isMutating}
                    className="w-9 h-9 shrink-0 rounded-full bg-success/20 text-success flex items-center justify-center disabled:opacity-50"
                    aria-label="Salvar valor guardado"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSaved(false)}
                    className="w-9 h-9 shrink-0 rounded-full bg-secondary flex items-center justify-center"
                    aria-label="Cancelar edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {savedError && <p className="text-caption text-destructive mt-2">{savedError}</p>}
              </div>
            )}
          </div>

          {!editingSaved && (
            <div className="flex gap-2">
              {isManual && (
                <button
                  type="button"
                  onClick={restoreCalculatedAmount}
                  disabled={isMutating}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center disabled:opacity-50"
                  aria-label="Usar valor calculado"
                  title="Usar valor calculado"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditingSaved(true)}
                className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center"
                aria-label="Alterar valor guardado"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {!editingSaved && savedError && (
          <p className="text-caption text-destructive mt-2">{savedError}</p>
        )}
      </GlassCard>

      <div className="space-y-3">
        {goals.length === 0 && (
          <GlassCard className="oppo-card glass-refractive">
            <p className="text-subhead text-muted-foreground">Sem dados de caixinhas para o período selecionado.</p>
          </GlassCard>
        )}

        {goals.map((goal, index) => {
          const percentMeta = Number(goal.progresso_meta || 0);
          const percentPlus = Number(goal.progresso_plus || 0);
          const hasMeta = Number(goal.meta || 0) > 0;
          const hasPlus = Number(goal.meta_plus || 0) > 0;
          const suggestedDeposit = distribuicaoSaldo.find(d => d.categoria === goal.categoria)?.valor || 0;

          return (
            <GlassCard key={goal.categoria} delay={0.15 + index * 0.06} className="relative overflow-hidden oppo-card glass-refractive">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl liquid-glass-sm flex items-center justify-center text-2xl border border-border/50">
                  {emojiByCategory[goal.categoria] || '💰'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1 items-start">
                    <p className="text-headline font-bold text-foreground">{goal.categoria}</p>
                    {suggestedDeposit > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/20 text-success uppercase tracking-wider border border-success/30">
                        + R$ {suggestedDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sugerido hoje
                      </span>
                    )}
                  </div>
                  <p className="text-caption font-bold text-muted-foreground/80 tracking-tight">
                    R$ {Number(goal.valor_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {hasMeta
                      ? ` de R$ ${Number(goal.meta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : ''}
                  </p>
                </div>
                {hasMeta && (
                  <div className="text-right">
                    <span className="text-subhead font-black text-foreground block">{Math.round(percentMeta)}%</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">Concluído</span>
                  </div>
                )}
              </div>

              {hasMeta ? (
                <div className="space-y-3">
                  <GlassProgressBar
                    value={Number(goal.valor_acumulado || 0)}
                    max={Number(goal.meta || 1)}
                    variant="savings"
                  />
                  <p className="text-caption font-bold text-muted-foreground/70 tracking-tight">
                    {Number(goal.faltante_meta || 0) > 0
                      ? `Faltam R$ ${Number(goal.faltante_meta || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })} para a meta`
                      : '✅ Meta principal batida!'}
                  </p>
                </div>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-secondary/55 border border-border/50">
                   <p className="text-caption font-medium italic text-muted-foreground/60 text-center">Defina uma meta para acompanhar o progresso</p>
                </div>
              )}

              {hasPlus && (
                <div className="mt-5 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Meta Plus</p>
                    <p className="text-caption font-black text-income">{Math.round(percentPlus)}%</p>
                  </div>
                  <GlassProgressBar
                    value={Number(goal.valor_acumulado || 0)}
                    max={Number(goal.meta_plus || 1)}
                    variant="income"
                  />
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </PageContainer>
  );
};

export default Savings;
