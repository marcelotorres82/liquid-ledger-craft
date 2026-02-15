import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { useFinanceStore } from "@/store/financeStore";

const Analytics = () => {
  const { incomeEntries, expenseEntries } = useFinanceStore();

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const categoryMap = expenseEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {});

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, value], index) => ({
      name,
      value,
      pct: totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0,
      color: ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#6366F1"][index % 6],
    }))
    .sort((a, b) => b.value - a.value);

  const monthLabels = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];
  const monthlyTrend = monthLabels.map((month, index) => {
    const divisor = 6 - index;
    return {
      month,
      income: totalIncome > 0 ? totalIncome / divisor : 0,
      expenses: totalExpenses > 0 ? totalExpenses / divisor : 0,
    };
  });

  const maxVal = Math.max(...monthlyTrend.map((item) => Math.max(item.income, item.expenses)), 1);

  return (
    <PageContainer title="Análise" subtitle="Insights sobre suas finanças">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <GlassCard delay={0.1} className="text-center p-3">
          <TrendingUp className="w-5 h-5 text-income mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Receitas</p>
          <p className="text-subhead font-semibold text-foreground">R$ {(totalIncome / 1000).toFixed(1)}k</p>
        </GlassCard>
        <GlassCard delay={0.15} className="text-center p-3">
          <TrendingDown className="w-5 h-5 text-expense mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Despesas</p>
          <p className="text-subhead font-semibold text-foreground">R$ {(totalExpenses / 1000).toFixed(1)}k</p>
        </GlassCard>
        <GlassCard delay={0.2} className="text-center p-3">
          <Target className="w-5 h-5 text-savings mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Economia</p>
          <p className="text-subhead font-semibold text-savings">
            <AnimatedNumber value={savingsRate} suffix="%" decimals={0} />
          </p>
        </GlassCard>
      </div>

      <h2 className="text-title-3 text-foreground mb-3">Tendência mensal</h2>
      <GlassCard delay={0.25} className="mb-6">
        <div className="flex items-end justify-between gap-2 h-36">
          {monthlyTrend.map((m, i) => {
            const incH = (m.income / maxVal) * 100;
            const expH = (m.expenses / maxVal) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full h-28">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${incH}%` }} transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }} className="flex-1 gradient-income rounded-t-lg min-h-[4px]" />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${expH}%` }} transition={{ duration: 0.6, delay: 0.35 + i * 0.05 }} className="flex-1 gradient-expense rounded-t-lg min-h-[4px] opacity-70" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{m.month}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <h2 className="text-title-3 text-foreground mb-3">Por categoria</h2>
      <GlassCard delay={0.4}>
        <div className="space-y-3">
          {categoryBreakdown.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.04 }} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-subhead text-foreground flex-1">{cat.name}</span>
              <span className="text-subhead font-medium text-foreground">R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span className="text-caption text-muted-foreground w-10 text-right">{cat.pct}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </PageContainer>
  );
};

export default Analytics;
