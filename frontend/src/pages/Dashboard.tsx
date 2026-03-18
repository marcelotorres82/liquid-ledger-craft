import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TransactionsCard } from "@/components/dashboard/TransactionsCard";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { useFinanceStore } from "@/store/financeStore";
import { getMonthName } from "@/lib/format";

const transition = { duration: 0.6, ease: [0.2, 0, 0, 1] as const };

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const currentMonth = useFinanceStore((state) => state.currentMonth);
  const currentYear = useFinanceStore((state) => state.currentYear);
  const user = useFinanceStore((state) => state.user);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-lg px-4 pt-12 sm:pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Olá, {user?.nome?.split(' ')[0] || 'Marcelo'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getMonthName(currentMonth)} {currentYear}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </motion.div>

        {/* Cards */}
        <div className="space-y-4">
          <BalanceCard />
          <TransactionsCard />
          <InsightsCard />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
