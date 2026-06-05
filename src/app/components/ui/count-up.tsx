import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

interface CountUpProps {
  value: string;
  className?: string;
}

function parseNumeric(value: string): { prefix: string; num: number; suffix: string } | null {
  const match = value.match(/^([^0-9]*)([0-9]+)(.*)$/);
  if (!match) return null;
  return { prefix: match[1], num: Number(match[2]), suffix: match[3] };
}

export function CountUp({ value, className }: CountUpProps) {
  const reducedMotion = useReducedMotion();
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!parsed || reducedMotion) {
      setDisplay(value);
      return;
    }

    const { prefix, num, suffix } = parsed;
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${prefix}${Math.round(num * eased)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, parsed, reducedMotion]);

  return <span className={className}>{display}</span>;
}
