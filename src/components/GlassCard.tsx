import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

const GlassCard = ({ children, className, delay = 0, onClick }: GlassCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    whileTap={onClick ? { scale: 0.97 } : undefined}
    onClick={onClick}
    className={cn("glass-card", onClick && "cursor-pointer", className)}
  >
    {children}
  </motion.div>
);

export default GlassCard;
