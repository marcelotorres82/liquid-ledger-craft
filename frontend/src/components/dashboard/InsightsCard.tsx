import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useFinanceStore } from "@/store/financeStore";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

export const InsightsCard = () => {
  const insight = useFinanceStore((state) => state.insight);
  const insightHint = useFinanceStore((state) => state.insightHint);
  const isLoadingInsights = useFinanceStore((state) => state.isLoadingInsights);
  const refreshInsights = useFinanceStore((state) => state.refreshInsights);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition, delay: 0.5 }}
      className="glass-card rounded-3xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold tracking-tight">Insights de IA</h3>
        </div>
        <button
          onClick={() => refreshInsights()}
          disabled={isLoadingInsights}
          className="p-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {isLoadingInsights ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {isLoadingInsights ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
        </div>
      ) : insight ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight}
          </p>
          {insightHint && (
            <p className="text-xs text-muted-foreground/60">
              {insightHint}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          Sem insights disponíveis para o período atual.
        </p>
      )}
    </motion.div>
  );
};
