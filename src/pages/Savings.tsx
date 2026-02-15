import { useState } from "react";
import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import GlassProgressBar from "@/components/GlassProgressBar";
import AnimatedNumber from "@/components/AnimatedNumber";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useFinanceStore } from "@/store/financeStore";

const Savings = () => {
  const { savingsGoals, addSavingsGoal } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [emoji, setEmoji] = useState("🎯");

  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);

  const handleSave = async () => {
    if (!name || !target) return;

    await addSavingsGoal({
      name,
      emoji,
      current: Number(current || 0),
      target: Number(target),
      color: "savings",
    });

    setOpen(false);
    setName("");
    setTarget("");
    setCurrent("");
    setEmoji("🎯");
  };

  return (
    <PageContainer title="Caixinhas" subtitle="Metas inteligentes de economia">
      <GlassCard delay={0.1} className="mb-6 text-center">
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total guardado</p>
        <div className="text-large-title text-savings">
          <AnimatedNumber value={totalSaved} prefix="R$ " />
        </div>
      </GlassCard>

      {open && (
        <GlassCard delay={0.12} className="mb-4">
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da meta" className="w-full px-4 py-2 rounded-xl bg-secondary" />
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Valor alvo" type="number" className="w-full px-4 py-2 rounded-xl bg-secondary" />
            <input value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Valor atual" type="number" className="w-full px-4 py-2 rounded-xl bg-secondary" />
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" className="w-full px-4 py-2 rounded-xl bg-secondary" />
            <button onClick={handleSave} className="w-full py-2 rounded-xl gradient-savings text-savings-foreground">Salvar meta</button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-3">
        {savingsGoals.map((goal, i) => (
          <GlassCard key={goal.id} delay={0.15 + i * 0.08}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{goal.emoji}</span>
              <div className="flex-1">
                <p className="text-headline text-foreground">{goal.name}</p>
                <p className="text-caption text-muted-foreground">
                  R$ {goal.current.toLocaleString("pt-BR")} de R$ {goal.target.toLocaleString("pt-BR")}
                </p>
              </div>
              <span className="text-subhead font-semibold text-foreground">{Math.round((goal.current / goal.target) * 100)}%</span>
            </div>
            <GlassProgressBar value={goal.current} max={goal.target} variant={goal.color} />
          </GlassCard>
        ))}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-savings flex items-center justify-center shadow-lg shadow-savings/30 tap-highlight-none z-40"
      >
        <Plus className="w-6 h-6 text-savings-foreground" />
      </motion.button>
    </PageContainer>
  );
};

export default Savings;
