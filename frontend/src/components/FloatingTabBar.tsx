import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sparkleTransition } from "@/lib/motion";

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
    <div className="floating-tab-wrap fixed left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-lg transition-opacity duration-200 [bottom:calc(1rem+env(safe-area-inset-bottom,0px))]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={sparkleTransition}
        className="mx-auto w-fit"
      >
        <div className="liquid-nav-shell rounded-3xl px-2 py-2 flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive =
              tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative min-w-0 flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 tap-highlight-none",
                  isActive ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="w-full truncate text-center text-[9px] font-medium">
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
