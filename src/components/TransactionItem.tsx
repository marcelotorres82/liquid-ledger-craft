import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: number;
  type: "income" | "expense";
  delay?: number;
}

const TransactionItem = ({ icon, title, subtitle, amount, type, delay = 0 }: TransactionItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    className="flex items-center gap-3 py-3"
  >
    <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-subhead font-medium text-foreground truncate">{title}</p>
      <p className="text-caption text-muted-foreground">{subtitle}</p>
    </div>
    <span className={cn("text-subhead font-semibold", type === "income" ? "text-income" : "text-expense")}>
      {type === "income" ? "+" : "-"} R$ {Math.abs(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
    </span>
  </motion.div>
);

export default TransactionItem;
