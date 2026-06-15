import { motion, useReducedMotion } from "motion/react";
import { cn } from "../ui/utils";

const DRAW_EASE = [0.22, 1, 0.36, 1] as const;

function ringTransition(reducedMotion: boolean | null, delay = 0) {
  return reducedMotion
    ? { duration: 0 }
    : {
        duration: 0.85,
        delay,
        ease: DRAW_EASE,
        repeat: Infinity,
        repeatDelay: 2.8,
        repeatType: "loop" as const,
      };
}

function pathTransition(reducedMotion: boolean | null, delay = 0) {
  return reducedMotion
    ? { duration: 0 }
    : {
        duration: 0.9,
        delay,
        ease: DRAW_EASE,
        repeat: Infinity,
        repeatDelay: 2.8,
        repeatType: "loop" as const,
        times: [0, 0.55, 0.78, 1],
      };
}

export function AnimatedFeatureIncluded({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  const reducedMotion = useReducedMotion();
  const radius = 9;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      role="img"
      aria-label="Included"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <motion.circle
          cx={12}
          cy={12}
          r={radius}
          fill="none"
          strokeWidth={1.5}
          className="stroke-success/25 dark:stroke-success/35"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reducedMotion ? 0 : circumference, opacity: reducedMotion ? 1 : 0.4 }}
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={ringTransition(reducedMotion)}
        />
        <motion.path
          d="M7.5 12.2 10.4 15.1 16.5 8.8"
          fill="none"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-success"
          initial={{ pathLength: reducedMotion ? 1 : 0 }}
          animate={{ pathLength: [0, 1, 0.82, 1] }}
          transition={pathTransition(reducedMotion, 0.12)}
        />
      </svg>
    </span>
  );
}

export function AnimatedFeatureExcluded({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  const reducedMotion = useReducedMotion();
  const radius = 9;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      role="img"
      aria-label="Not included"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <motion.circle
          cx={12}
          cy={12}
          r={radius}
          fill="none"
          strokeWidth={1.5}
          className="stroke-muted-foreground/20 dark:stroke-muted-foreground/30"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reducedMotion ? 0 : circumference, opacity: reducedMotion ? 1 : 0.35 }}
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={ringTransition(reducedMotion)}
        />
        <motion.path
          d="M7.5 12h9"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          className="stroke-muted-foreground/55 dark:stroke-muted-foreground/70"
          initial={{ pathLength: reducedMotion ? 1 : 0 }}
          animate={{ pathLength: [0, 1, 0.75, 1] }}
          transition={pathTransition(reducedMotion, 0.1)}
        />
      </svg>
    </span>
  );
}
