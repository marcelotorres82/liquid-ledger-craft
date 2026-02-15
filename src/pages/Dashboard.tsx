import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import { useFinanceStore } from "@/store/financeStore";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { incomeEntries, expenseEntries } = useFinanceStore();

  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const recentTransactions = [
    ...incomeEntries.slice(0, 2).map((e) => ({ ...e, type: "income" as const })),
    ...expenseEntries.slice(0, 3).map((e) => ({ ...e, type: "expense" as const })),
  ].slice(0, 5);

  return (
    <PageContainer title="Olá! 👋" subtitle="Fevereiro 2026">
      <GlassCard className="mb-4 overflow-hidden relative" delay={0.1}>
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Saldo do mês</p>
        <div className="text-large-title text-foreground">
          <AnimatedNumber value={balance} prefix="R$ " />
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <GlassCard delay={0.15}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl gradient-income flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-income-foreground" />
            </div>
            <span className="text-caption text-muted-foreground">Receitas</span>
          </div>
          <div className="text-title-3 text-foreground">
            <AnimatedNumber value={totalIncome} prefix="R$ " />
          </div>
        </GlassCard>

        <GlassCard delay={0.2}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl gradient-expense flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-expense-foreground" />
            </div>
            <span className="text-caption text-muted-foreground">Despesas</span>
          </div>
          <div className="text-title-3 text-foreground">
            <AnimatedNumber value={totalExpenses} prefix="R$ " />
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.25} className="mb-6 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-subhead font-semibold text-foreground">Você economizou {savingsRate}% este mês</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {savingsRate >= 30 ? "Ótimo progresso! Continue assim." : "Tente reduzir gastos para atingir suas metas."}
            </p>
          </div>
        </div>
      </GlassCard>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-title-3 text-foreground mb-3">Recentes</h2>
        <GlassCard delay={0.35} className="divide-y divide-border">
          {recentTransactions.map((t, i) => (
            <TransactionItem
              key={t.id + t.type}
              icon={<span className="text-lg">{t.icon}</span>}
              title={t.title}
              subtitle={t.category}
              amount={t.amount}
              type={t.type}
              delay={0.4 + i * 0.05}
            />
          ))}
        </GlassCard>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
