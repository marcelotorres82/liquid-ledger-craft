import { Home, TrendingUp, ArrowDownCircle, Wallet, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/app" },
  { icon: TrendingUp, label: "Receitas", path: "/app/income" },
  { icon: ArrowDownCircle, label: "Despesas", path: "/app/expenses" },
  { icon: Wallet, label: "Caixinhas", path: "/app/savings" },
  { icon: BarChart3, label: "Análise", path: "/app/analytics" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-card-static rounded-3xl px-2 py-2 flex items-center gap-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                active ? "bg-foreground/10" : "hover:bg-foreground/5"
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
