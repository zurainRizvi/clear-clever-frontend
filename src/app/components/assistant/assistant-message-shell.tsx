import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { quickTransition } from "@/lib/motion-presets";

export function AssistantMessageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="flex gap-3 max-w-full"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-sm mt-0.5"
        aria-hidden
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/60 bg-muted/50 px-4 py-3.5 shadow-sm">
        {children}
      </div>
    </motion.div>
  );
}
