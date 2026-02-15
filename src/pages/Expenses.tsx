import { useState } from "react";
import { Plus } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import TransactionSheet from "@/components/TransactionSheet";
import { useFinanceStore, Transaction } from "@/store/financeStore";
import { motion, AnimatePresence } from "framer-motion";

const expenseCategories = ["Moradia", "Alimentação", "Transporte", "Saúde", "Contas", "Entretenimento", "Outros"];
const expenseIcons = ["🏠", "🛒", "📺", "🚗", "💪", "💊", "📡", "🍽️", "📝"];

const categoryColors: Record<string, string> = {
  Moradia: "#3B82F6",
  Alimentação: "#F59E0B",
  Transporte: "#8B5CF6",
  Saúde: "#10B981",
  Contas: "#6366F1",
  Entretenimento: "#EC4899",
  Outros: "#94A3B8",
};

const Expenses = () => {
  const { expenseEntries, addExpense, updateExpense, deleteExpense } = useFinanceStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const total = expenseEntries.reduce((s, e) => s + e.amount, 0);

  // Compute category breakdown dynamically
  const breakdown = Object.entries(
    expenseEntries.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || "#94A3B8",
    pct: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.value - a.value);

  const handleSave = (data: Omit<Transaction, "id">) => {
    if (editing) {
      updateExpense(editing.id, data);
      setEditing(null);
    } else {
      addExpense(data);
    }
  };

  return (
    <PageContainer title="Despesas" subtitle="Para onde vai seu dinheiro">
      <GlassCard delay={0.1} className="mb-4 text-center">
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total do mês</p>
        <div className="text-large-title text-expense">
          <AnimatedNumber value={total} prefix="R$ " />
        </div>
      </GlassCard>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {breakdown.map((cat, i) => (
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
        <AnimatePresence>
          {expenseEntries.map((e, i) => (
            <TransactionItem
              key={e.id}
              icon={<span className="text-lg">{e.icon}</span>}
              title={e.title}
              subtitle={`${e.category} · ${e.date}`}
              amount={e.amount}
              type="expense"
              delay={0.3 + i * 0.04}
              onEdit={() => { setEditing(e); setSheetOpen(true); }}
              onDelete={() => deleteExpense(e.id)}
            />
          ))}
        </AnimatePresence>
      </GlassCard>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setEditing(null); setSheetOpen(true); }}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-expense flex items-center justify-center shadow-lg shadow-expense/30 tap-highlight-none z-40"
      >
        <Plus className="w-6 h-6 text-expense-foreground" />
      </motion.button>

      <TransactionSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        type="expense"
        categories={expenseCategories}
        icons={expenseIcons}
      />
    </PageContainer>
  );
};

export default Expenses;
