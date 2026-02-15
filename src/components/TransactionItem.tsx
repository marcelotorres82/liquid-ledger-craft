import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: number;
  type: "income" | "expense";
  delay?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TransactionItem = ({ icon, title, subtitle, amount, type, delay = 0, onEdit, onDelete }: TransactionItemProps) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      layout
      className="flex items-center gap-3 py-3"
      onClick={() => setShowActions((v) => !v)}
    >
      <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-subhead font-medium text-foreground truncate">{title}</p>
        <p className="text-caption text-muted-foreground">{subtitle}</p>
      </div>

      <AnimatePresence>
        {showActions && (onEdit || onDelete) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: "auto" }}
            exit={{ opacity: 0, scale: 0.8, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 shrink-0 overflow-hidden"
          >
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center tap-highlight-none active:scale-90 transition-transform"
              >
                <Pencil className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center tap-highlight-none active:scale-90 transition-transform"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            )}
          </motion.div>
        ) : (
          <span className={cn("text-subhead font-semibold shrink-0", type === "income" ? "text-income" : "text-expense")}>
            {type === "income" ? "+" : "-"} R$ {Math.abs(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionItem;
