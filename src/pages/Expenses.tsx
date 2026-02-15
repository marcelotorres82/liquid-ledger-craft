import { Plus } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import { expenseEntries, monthlyData, categoryBreakdown } from "@/data/mockData";
import { motion } from "framer-motion";

const Expenses = () => (
  <PageContainer title="Despesas" subtitle="Para onde vai seu dinheiro">
    <GlassCard delay={0.1} className="mb-4 text-center">
      <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total do mês</p>
      <div className="text-large-title text-expense">
        <AnimatedNumber value={monthlyData.totalExpenses} prefix="R$ " />
      </div>
    </GlassCard>

    {/* Category pills */}
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {categoryBreakdown.map((cat, i) => (
        <motion.div
          key={cat.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.05 }}
          className="glass-subtle rounded-2xl px-3 py-2 flex items-center gap-2 shrink-0"
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="text-caption font-medium text-foreground whitespace-nowrap">{cat.name}</span>
          <span className="text-caption text-muted-foreground">{cat.pct}%</span>
        </motion.div>
      ))}
    </div>

    <GlassCard delay={0.25} className="divide-y divide-border">
      {expenseEntries.map((e, i) => (
        <TransactionItem
          key={e.id}
          icon={<span className="text-lg">{e.icon}</span>}
          title={e.title}
          subtitle={`${e.category} · ${e.date}`}
          amount={e.amount}
          type="expense"
          delay={0.3 + i * 0.04}
        />
      ))}
    </GlassCard>

    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-expense flex items-center justify-center shadow-lg shadow-expense/30 tap-highlight-none z-40"
    >
      <Plus className="w-6 h-6 text-expense-foreground" />
    </motion.button>
  </PageContainer>
);

export default Expenses;
