import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassProgressBarProps {
  value: number;
  max: number;
  variant?: "income" | "expense" | "savings";
  className?: string;
}

const gradientMap = {
  income: "gradient-income",
  expense: "gradient-expense",
  savings: "gradient-savings",
};

const GlassProgressBar = ({ value, max, variant = "savings", className }: GlassProgressBarProps) => {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("h-2.5 rounded-full bg-secondary overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={cn("h-full rounded-full", gradientMap[variant])}
      />
    </div>
  );
};

export default GlassProgressBar;
