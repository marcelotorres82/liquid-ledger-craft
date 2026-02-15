import { ArrowUpRight, ArrowDownRight, Wallet, Sparkles } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import { monthlyData, incomeEntries, expenseEntries } from "@/data/mockData";
import { motion } from "framer-motion";

const Dashboard = () => {
  const recentTransactions = [
    ...incomeEntries.slice(0, 2).map((e) => ({ ...e, type: "income" as const })),
    ...expenseEntries.slice(0, 3).map((e) => ({ ...e, type: "expense" as const })),
  ].sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <PageContainer title="Olá! 👋" subtitle={monthlyData.month}>
      {/* Balance Card */}
      <GlassCard className="mb-4 overflow-hidden relative" delay={0.1}>
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Saldo do mês</p>
        <div className="text-large-title text-foreground">
          <AnimatedNumber value={monthlyData.balance} prefix="R$ " />
        </div>
      </GlassCard>

      {/* Income / Expense Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <GlassCard delay={0.15}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl gradient-income flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-income-foreground" />
            </div>
            <span className="text-caption text-muted-foreground">Receitas</span>
          </div>
          <div className="text-title-3 text-foreground">
            <AnimatedNumber value={monthlyData.totalIncome} prefix="R$ " />
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
            <AnimatedNumber value={monthlyData.totalExpenses} prefix="R$ " />
          </div>
        </GlassCard>
      </div>

      {/* Insight Card */}
      <GlassCard delay={0.25} className="mb-6 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-subhead font-semibold text-foreground">Você economizou 38% este mês</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              Ótimo progresso! Continue assim para atingir suas metas.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
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
