import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface LiquidGlassProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sm';
  tint?: string; // ex: 'rgba(99,102,241,0.08)' para roxo
  onClick?: () => void;
}

export function LiquidGlass({
  children,
  className,
  variant = 'default',
  tint,
  onClick,
  ...motionProps
}: LiquidGlassProps) {
  return (
    <motion.div
      className={cn(
        variant === 'sm' ? 'liquid-glass-sm' : 'liquid-glass',
        'relative',
        className
      )}
      style={tint ? { background: tint } : undefined}
      whileHover={onClick ? { scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.995 } : undefined}
      onClick={onClick}
      {...motionProps}
    >
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
