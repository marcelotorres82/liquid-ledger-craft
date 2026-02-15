import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const PageContainer = ({ children, title, subtitle, className }: PageContainerProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className={cn("min-h-screen pb-28 px-4 pt-12 max-w-lg mx-auto", className)}
  >
    {title && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <h1 className="text-large-title text-foreground">{title}</h1>
        {subtitle && <p className="text-subhead text-muted-foreground mt-1">{subtitle}</p>}
      </motion.div>
    )}
    {children}
  </motion.div>
);

export default PageContainer;
