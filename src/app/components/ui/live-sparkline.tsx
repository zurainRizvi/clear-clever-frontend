import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return hash;
}

function buildPoints(seed: string, data?: number[]): number[] {
  if (data && data.length > 1) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    return data.map((value) => 2 + ((value - min) / span) * 14);
  }

  let hash = hashSeed(seed);
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    hash = (hash * 1103515245 + 12345) | 0;
    pts.push(2 + ((hash >>> 16) % 14));
  }
  return pts;
}

function pathFromPoints(points: number[], width: number, height: number): string {
  const step = width / (points.length - 1);
  return points
    .map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - y}`)
    .join(" ");
}

interface LiveSparklineProps {
  seed: string;
  color: string;
  data?: number[];
  className?: string;
  width?: number;
  height?: number;
}

/** Sparkline with a always-visible track and a drawing stroke that loops forward then back. */
export function LiveSparkline({
  seed,
  color,
  data,
  className = "",
  width = 120,
  height = 36,
}: LiveSparklineProps) {
  const reducedMotion = useReducedMotion();
  const points = useMemo(() => buildPoints(seed, data), [seed, data]);
  const pathD = useMemo(() => pathFromPoints(points, width, height), [points, width, height]);

  const strokeProps = {
    d: pathD,
    fill: "none" as const,
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`block w-full max-w-full overflow-visible ${className}`}
      aria-hidden
    >
      <path {...strokeProps} opacity={0.32} />

      {reducedMotion ? (
        <path {...strokeProps} opacity={0.9} />
      ) : (
        <motion.path
          {...strokeProps}
          opacity={0.95}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.38, 1],
          }}
        />
      )}
    </svg>
  );
}
