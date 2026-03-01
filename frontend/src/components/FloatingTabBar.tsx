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
    <div className="floating-tab-wrap fixed left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-lg transition-opacity duration-200 [bottom:calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
        className="mx-auto w-full"
      >
        <div className="liquid-nav-shell w-full px-1.5 py-1.5 grid grid-cols-5 items-center gap-1 shadow-md shadow-foreground/5">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative min-w-0 flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-full transition-all duration-300 tap-highlight-none",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 liquid-nav-item-active rounded-full"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <tab.icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.4 : 2} />
                <span className="w-full truncate text-center text-[10px] font-medium relative z-10 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingTabBar;
