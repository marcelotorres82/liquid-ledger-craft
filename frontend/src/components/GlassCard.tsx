import { LiquidGlass } from "./LiquidGlass";
import { cn } from "@/lib/utils";
import { sparkleCardAnimate, sparkleCardInitial, sparkleTransition } from "@/lib/motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  variant?: 'default' | 'sm';
}

const GlassCard = ({ children, className, delay = 0, onClick, variant = 'default' }: GlassCardProps) => (
  <LiquidGlass
    initial={sparkleCardInitial}
    animate={sparkleCardAnimate}
    transition={{ ...sparkleTransition, delay }}
    whileTap={onClick ? { scale: 0.97 } : undefined}
    onClick={onClick}
    className={cn(onClick && "cursor-pointer", className)}
    variant={variant}
  >
    {children}
  </LiquidGlass>
);

export default GlassCard;
