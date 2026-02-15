import { Plus } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import { incomeEntries, monthlyData } from "@/data/mockData";
import { motion } from "framer-motion";

const Income = () => (
  <PageContainer title="Receitas" subtitle="Suas fontes de renda">
    <GlassCard delay={0.1} className="mb-6 text-center">
      <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total do mês</p>
      <div className="text-large-title text-income">
        <AnimatedNumber value={monthlyData.totalIncome} prefix="R$ " />
      </div>
      <p className="text-caption text-muted-foreground mt-1">{incomeEntries.length} entradas</p>
    </GlassCard>

    <GlassCard delay={0.2} className="divide-y divide-border">
      {incomeEntries.map((e, i) => (
        <TransactionItem
          key={e.id}
          icon={<span className="text-lg">{e.icon}</span>}
          title={e.title}
          subtitle={`${e.category} · ${e.date}`}
          amount={e.amount}
          type="income"
          delay={0.25 + i * 0.05}
        />
      ))}
    </GlassCard>

    {/* FAB */}
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-income flex items-center justify-center shadow-lg shadow-income/30 tap-highlight-none z-40"
    >
      <Plus className="w-6 h-6 text-income-foreground" />
    </motion.button>
  </PageContainer>
);

export default Income;
