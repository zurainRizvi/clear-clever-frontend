import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { pageEnter } from "@/lib/motion-presets";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  stagger?: boolean;
}

export function AnimatedPage({ children, className, style, stagger }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageEnter}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={style}
    >
      {stagger ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}
