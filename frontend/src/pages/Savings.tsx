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
  Carro: '🚗',
  Reserva: '🛟',
  'Férias': '🏖️',
  Ferias: '🏖️',
  Lazer: '🎉',
};

const Savings = ({ onLogout }: SavingsProps) => {
  const dashboard = useFinanceStore((state) => state.dashboard);
  const totalSaved = Number(dashboard?.caixinhas?.total_acumulado || 0);
  const goals = dashboard?.caixinhas?.categorias || [];
  const cycleStart = dashboard?.caixinhas?.inicio_ciclo;

  const periodLabel =
    cycleStart && dashboard?.caixinhas?.meses_considerados
      ? `${getShortMonthName(cycleStart.mes)}/${cycleStart.ano} • ${dashboard.caixinhas.meses_considerados} meses`
      : 'Ciclo atual';

  return (
    <PageContainer title="Caixinhas" subtitle="Metas inteligentes de economia" onLogout={onLogout}>
      <GlassCard delay={0.1} className="mb-6 text-center">
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total acumulado</p>
        <div className="text-large-title text-savings">
          <AnimatedNumber value={totalSaved} prefix="R$ " />
        </div>
        <p className="text-caption text-muted-foreground mt-1">{periodLabel}</p>
      </GlassCard>

      <div className="space-y-3">
        {goals.length === 0 && (
          <GlassCard>
            <p className="text-subhead text-muted-foreground">Sem dados de caixinhas para o período selecionado.</p>
          </GlassCard>
        )}

        {goals.map((goal, index) => {
          const percentMeta = Number(goal.progresso_meta || 0);
          const percentPlus = Number(goal.progresso_plus || 0);
          const hasMeta = Number(goal.meta || 0) > 0;
          const hasPlus = Number(goal.meta_plus || 0) > 0;

          return (
            <GlassCard key={goal.categoria} delay={0.15 + index * 0.06}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{emojiByCategory[goal.categoria] || '💰'}</span>
                <div className="flex-1">
                  <p className="text-headline text-foreground">{goal.categoria}</p>
                  <p className="text-caption text-muted-foreground">
                    R$ {Number(goal.valor_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {hasMeta
                      ? ` de R$ ${Number(goal.meta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : ''}
                  </p>
                </div>
                {hasMeta && (
                  <span className="text-subhead font-semibold text-foreground">{Math.round(percentMeta)}%</span>
                )}
              </div>

              {hasMeta ? (
                <>
                  <GlassProgressBar
                    value={Number(goal.valor_acumulado || 0)}
                    max={Number(goal.meta || 1)}
                    variant="savings"
                  />
                  <p className="text-caption text-muted-foreground mt-2">
                    {Number(goal.faltante_meta || 0) > 0
                      ? `Faltam R$ ${Number(goal.faltante_meta || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })} para a meta principal`
                      : 'Meta principal concluída'}
                  </p>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">Meta principal não definida para esta categoria.</p>
              )}

              {hasPlus && (
                <div className="mt-3">
                  <p className="text-caption text-muted-foreground mb-1">Meta plus: {Math.round(percentPlus)}%</p>
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
