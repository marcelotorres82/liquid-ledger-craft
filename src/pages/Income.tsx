import { useState } from "react";
import { Plus } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import TransactionItem from "@/components/TransactionItem";
import TransactionSheet from "@/components/TransactionSheet";
import { useFinanceStore, Transaction } from "@/store/financeStore";
import { motion, AnimatePresence } from "framer-motion";

const incomeCategories = ["Trabalho", "Freelance", "Investimentos", "Outros"];
const incomeIcons = ["💼", "🎨", "📈", "💳", "🏦", "💰", "📝"];

const Income = () => {
  const { incomeEntries, addIncome, updateIncome, deleteIncome } = useFinanceStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const total = incomeEntries.reduce((s, e) => s + e.amount, 0);

  const handleSave = (data: Omit<Transaction, "id">) => {
    if (editing) {
      updateIncome(editing.id, data);
      setEditing(null);
    } else {
      addIncome(data);
    }
  };

  return (
    <PageContainer title="Receitas" subtitle="Suas fontes de renda">
      <GlassCard delay={0.1} className="mb-6 text-center">
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total do mês</p>
        <div className="text-large-title text-income">
          <AnimatedNumber value={total} prefix="R$ " />
        </div>
        <p className="text-caption text-muted-foreground mt-1">{incomeEntries.length} entradas</p>
      </GlassCard>

      <GlassCard delay={0.2} className="divide-y divide-border">
        <AnimatePresence>
          {incomeEntries.map((e, i) => (
            <TransactionItem
              key={e.id}
              icon={<span className="text-lg">{e.icon}</span>}
              title={e.title}
              subtitle={`${e.category} · ${e.date}`}
              amount={e.amount}
              type="income"
              delay={0.25 + i * 0.05}
              onEdit={() => { setEditing(e); setSheetOpen(true); }}
              onDelete={() => deleteIncome(e.id)}
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
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-income flex items-center justify-center shadow-lg shadow-income/30 tap-highlight-none z-40"
      >
        <Plus className="w-6 h-6 text-income-foreground" />
      </motion.button>

      <TransactionSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        type="income"
        categories={incomeCategories}
        icons={incomeIcons}
      />
    </PageContainer>
  );
};

export default Income;
