import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sparkleItemAnimate, sparkleItemInitial, sparkleTransition } from "@/lib/motion";

interface TransactionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: number;
  type: "income" | "expense";
  delay?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isStriked?: boolean;
}

const TransactionItem = ({
  icon,
  title,
  subtitle,
  amount,
  type,
  delay = 0,
  onEdit,
  onDelete,
  isStriked = false,
}: TransactionItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const hasActions = Boolean(onEdit || onDelete);
  
  const amountText = `${type === "income" ? "+" : "-"} R$ ${Math.abs(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={sparkleItemInitial}
      animate={sparkleItemAnimate}
      exit={{ opacity: 0, x: 10, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ ...sparkleTransition, delay }}
      layout
      className={cn("flex items-center gap-3 py-3", hasActions && "cursor-pointer")}
      onClick={hasActions ? () => setShowActions((v) => !v) : undefined}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium text-foreground truncate", isStriked && "line-through opacity-60")}>
          {title}
        </p>
        <p className={cn("text-xs text-muted-foreground truncate", isStriked && "line-through opacity-50")}>
          {subtitle}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0">
        {hasActions ? (
          <AnimatePresence>
            {showActions ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1 shrink-0 overflow-hidden"
              >
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center tap-highlight-none active:scale-90 transition-transform"
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center tap-highlight-none active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </motion.div>
            ) : (
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums whitespace-nowrap",
                  isStriked && "line-through opacity-60",
                  type === "income" ? "text-success" : "text-foreground"
                )}
              >
                {amountText}
              </span>
            )}
          </AnimatePresence>
        ) : (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums whitespace-nowrap",
              isStriked && "line-through opacity-60",
              type === "income" ? "text-success" : "text-foreground"
            )}
          >
            {amountText}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionItem;
