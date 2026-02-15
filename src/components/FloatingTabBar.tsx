import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/income", icon: TrendingUp, label: "Receitas" },
  { path: "/expenses", icon: TrendingDown, label: "Despesas" },
  { path: "/savings", icon: PiggyBank, label: "Caixinhas" },
  { path: "/analytics", icon: BarChart3, label: "Análise" },
];

const FloatingTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="glass rounded-[22px] px-2 py-2 flex items-center gap-1 shadow-lg shadow-foreground/5">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300 tap-highlight-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FloatingTabBar;
