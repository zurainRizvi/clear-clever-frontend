import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { layoutSpring } from "@/lib/motion-presets";

interface PillTab {
  id: string;
  label: string;
}

interface AnimatedPillTabsProps {
  tabs: PillTab[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

export function AnimatedPillTabs({
  tabs,
  activeId,
  onChange,
  layoutId = "pill-tab-active",
  className = "",
}: AnimatedPillTabsProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={`relative overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />
      <LayoutGroup id={layoutId}>
        <div className="flex w-max min-w-full gap-2 px-1 py-0.5">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`relative shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={layoutSpring}
                  />
                ) : null}
                <motion.span
                  className="relative z-[1]"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                >
                  {tab.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
