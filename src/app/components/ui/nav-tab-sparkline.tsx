import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Lightweight animated sparkline for nav tabs — no Recharts. */
export function NavTabSparkline({
  seed,
  color,
  active = false,
  className = "",
}: {
  seed: string;
  color: string;
  active?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  const points = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) {
      hash = (hash * 1103515245 + 12345) | 0;
      pts.push(4 + ((hash >>> 16) % 12));
    }
    return pts;
  }, [seed]);

  const pathD = useMemo(() => {
    const w = 40;
    const h = 16;
    const step = w / (points.length - 1);
    return points
      .map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - y}`)
      .join(" ");
  }, [points]);

  const opacity = active ? 0.55 : 0.28;

  return (
    <svg
      viewBox="0 0 40 16"
      className={`h-3 w-10 shrink-0 ${className}`}
      aria-hidden
    >
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reducedMotion ? 1 : 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity }}
        transition={{
          pathLength: { duration: reducedMotion ? 0 : 0.8, ease: "easeOut" },
          opacity: { duration: 0.25 },
        }}
      />
    </svg>
  );
}
