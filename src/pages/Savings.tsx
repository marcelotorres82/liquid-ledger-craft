import PageContainer from "@/components/PageContainer";
import GlassCard from "@/components/GlassCard";
import GlassProgressBar from "@/components/GlassProgressBar";
import AnimatedNumber from "@/components/AnimatedNumber";
import { savingsGoals } from "@/data/mockData";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const Savings = () => {
  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);

  return (
    <PageContainer title="Caixinhas" subtitle="Metas inteligentes de economia">
      <GlassCard delay={0.1} className="mb-6 text-center">
        <p className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Total guardado</p>
        <div className="text-large-title text-savings">
          <AnimatedNumber value={totalSaved} prefix="R$ " />
        </div>
      </GlassCard>

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
              <span className="text-subhead font-semibold text-foreground">
                {Math.round((goal.current / goal.target) * 100)}%
              </span>
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
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full gradient-savings flex items-center justify-center shadow-lg shadow-savings/30 tap-highlight-none z-40"
      >
        <Plus className="w-6 h-6 text-savings-foreground" />
      </motion.button>
    </PageContainer>
  );
};

export default Savings;
