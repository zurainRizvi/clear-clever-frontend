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

/** Continuously animated sparkline — SVG dash flow + subtle pulse. */
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
  const gradientId = useMemo(() => `spark-grad-${hashSeed(seed) >>> 0}`, [seed]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`block w-full max-w-full overflow-visible ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="50%" stopColor={color} stopOpacity={0.85} />
          <stop offset="100%" stopColor={color} stopOpacity={0.15} />
        </linearGradient>
      </defs>

      <motion.path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0.2 }}
        animate={reducedMotion ? { opacity: 0.25 } : { opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 1, opacity: 0.85 }}
        animate={
          reducedMotion
            ? { opacity: 0.85 }
            : { opacity: [0.65, 1, 0.65], pathLength: [0.92, 1, 0.92] }
        }
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reducedMotion ? (
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="6 10"
          animate={{ strokeDashoffset: [0, -32] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          opacity={0.55}
        />
      ) : null}
    </svg>
  );
}
