import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { useReducedMotion } from "motion/react";
import { LiveSparkline } from "./live-sparkline";

export interface DashboardStatItem {
  id: string;
  icon: ReactNode;
  value: ReactNode;
  label: string;
  meta?: ReactNode;
  footer?: ReactNode;
  sparkColor?: string;
  sparkline?: number[];
  href?: string;
  cardClassName?: string;
  cardStyle?: CSSProperties;
}

interface DashboardStatsCarouselProps {
  items: DashboardStatItem[];
  /** Full marquee loop duration in seconds */
  durationSec?: number;
  className?: string;
}

function StatCard({ item }: { item: DashboardStatItem }) {
  const sparkColor = item.sparkColor ?? "#2563EB";

  const cardInner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="shrink-0">{item.icon}</div>
        {item.meta ? (
          <span className="text-xs font-semibold text-right leading-tight max-w-[55%]">{item.meta}</span>
        ) : null}
      </div>
      <div className="text-2xl font-bold leading-tight">{item.value}</div>
      <p className="text-sm text-muted-foreground mt-1 leading-snug">{item.label}</p>
      {item.footer ? <p className="text-xs mt-1.5 leading-snug">{item.footer}</p> : null}
      <LiveSparkline
        seed={item.id}
        color={sparkColor}
        data={item.sparkline}
        className="mt-3 h-9"
        height={36}
      />
    </>
  );

  const cardClasses = [
    "relative shrink-0 w-[260px] sm:w-[240px] md:w-[228px] rounded-xl border p-5",
    item.cardClassName ?? "bg-card border-border",
  ].join(" ");

  return (
    <div className={cardClasses} style={item.cardStyle}>
      {item.href ? (
        <Link to={item.href} className="block">
          {cardInner}
        </Link>
      ) : (
        cardInner
      )}
    </div>
  );
}

/** Infinite horizontal marquee of stat cards — pauses on hover/focus. */
export function DashboardStatsCarousel({
  items,
  durationSec = 36,
  className = "",
}: DashboardStatsCarouselProps) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  const track = [...items, ...items];
  const marqueeClass = reducedMotion ? "flex w-max gap-3 px-1" : "stats-marquee-track flex w-max gap-3 px-1";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />

      <div
        className={marqueeClass}
        style={
          reducedMotion
            ? undefined
            : {
                animationDuration: `${durationSec}s`,
                animationPlayState: paused ? "paused" : "running",
              }
        }
      >
        {track.map((item, index) => (
          <StatCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
