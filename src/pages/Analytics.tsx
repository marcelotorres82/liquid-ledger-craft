import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { monthlyTrend, categoryBreakdown, monthlyData } from "@/data/mockData";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

const Analytics = () => {
  const savingsRate = ((monthlyData.totalIncome - monthlyData.totalExpenses) / monthlyData.totalIncome * 100);

  return (
    <PageContainer title="Análise" subtitle="Insights sobre suas finanças">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <GlassCard delay={0.1} className="text-center p-3">
          <TrendingUp className="w-5 h-5 text-income mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Receitas</p>
          <p className="text-subhead font-semibold text-foreground">R$ 8,4k</p>
        </GlassCard>
        <GlassCard delay={0.15} className="text-center p-3">
          <TrendingDown className="w-5 h-5 text-expense mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Despesas</p>
          <p className="text-subhead font-semibold text-foreground">R$ 5,2k</p>
        </GlassCard>
        <GlassCard delay={0.2} className="text-center p-3">
          <Target className="w-5 h-5 text-savings mx-auto mb-1" />
          <p className="text-caption text-muted-foreground">Economia</p>
          <p className="text-subhead font-semibold text-savings">
            <AnimatedNumber value={savingsRate} suffix="%" decimals={0} />
          </p>
        </GlassCard>
      </div>

      {/* Trend Chart (simplified bar chart) */}
      <h2 className="text-title-3 text-foreground mb-3">Tendência mensal</h2>
      <GlassCard delay={0.25} className="mb-6">
        <div className="flex items-end justify-between gap-2 h-36">
          {monthlyTrend.map((m, i) => {
            const maxVal = Math.max(...monthlyTrend.map(t => Math.max(t.income, t.expenses)));
            const incH = (m.income / maxVal) * 100;
            const expH = (m.expenses / maxVal) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full h-28">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${incH}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                    className="flex-1 gradient-income rounded-t-lg min-h-[4px]"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${expH}%` }}
                    transition={{ duration: 0.6, delay: 0.35 + i * 0.05 }}
                    className="flex-1 gradient-expense rounded-t-lg min-h-[4px] opacity-70"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full gradient-income" />
            <span className="text-caption text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full gradient-expense opacity-70" />
            <span className="text-caption text-muted-foreground">Despesas</span>
          </div>
        </div>
      </GlassCard>

      {/* Category breakdown */}
      <h2 className="text-title-3 text-foreground mb-3">Por categoria</h2>
      <GlassCard delay={0.4}>
        <div className="space-y-3">
          {categoryBreakdown.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.04 }}
              className="flex items-center gap-3"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-subhead text-foreground flex-1">{cat.name}</span>
              <span className="text-subhead font-medium text-foreground">
                R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-caption text-muted-foreground w-10 text-right">{cat.pct}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </PageContainer>
  );
};

export default Analytics;
