import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { NavTabSparkline } from "./nav-tab-sparkline";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export interface DashboardStatItem {
  id: string;
  icon: ReactNode;
  value: ReactNode;
  label: string;
  /** Top-right meta (e.g. % change) */
  meta?: ReactNode;
  /** Bottom line (e.g. trend description) */
  footer?: ReactNode;
  sparkColor?: string;
  /** Real sparkline data — used when available (analytics) */
  sparkline?: number[];
  href?: string;
  cardClassName?: string;
  cardStyle?: CSSProperties;
}

interface DashboardStatsCarouselProps {
  items: DashboardStatItem[];
  intervalMs?: number;
  className?: string;
}

function StatSparkline({ seed, color, data }: { seed: string; color: string; data?: number[] }) {
  if (data && data.length > 1) {
    const chartData = data.map((value, index) => ({ index, value }));
    return (
      <div className="h-9 w-full min-w-0 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <NavTabSparkline
      seed={seed}
      color={color}
      active
      className="mt-3 h-4 w-full max-w-[120px]"
    />
  );
}

export function DashboardStatsCarousel({
  items,
  intervalMs = 3800,
  className = "",
}: DashboardStatsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const userSelectedRef = useRef(false);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const item = items[index];
      if (!item) return;
      const el = cardRefs.current.get(item.id);
      if (!el) return;
      el.scrollIntoView({ inline: "center", block: "nearest", behavior });
    },
    [items]
  );

  useEffect(() => {
    setActiveIndex(0);
    userSelectedRef.current = false;
  }, [items]);

  useEffect(() => {
    if (reducedMotion || paused || items.length <= 1) return;

    const timer = window.setInterval(() => {
      if (userSelectedRef.current) return;
      setActiveIndex((current) => {
        const next = (current + 1) % items.length;
        scrollToIndex(next, "smooth");
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, items.length, paused, reducedMotion, scrollToIndex]);

  const selectIndex = (index: number) => {
    userSelectedRef.current = true;
    setActiveIndex(index);
    scrollToIndex(index, reducedMotion ? "auto" : "smooth");
    window.setTimeout(() => {
      userSelectedRef.current = false;
    }, intervalMs * 2);
  };

  if (items.length === 0) return null;

  return (
    <div
      className={`space-y-3 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => {
            const active = index === activeIndex;
            const sparkColor = item.sparkColor ?? "#2563EB";

            const cardInner = (
              <>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="shrink-0">{item.icon}</div>
                  {item.meta ? (
                    <span className="text-xs font-semibold text-right leading-tight">{item.meta}</span>
                  ) : null}
                </div>
                <div className="text-2xl font-bold leading-tight">{item.value}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{item.label}</p>
                {item.footer ? (
                  <p className="text-xs mt-1.5 leading-snug">{item.footer}</p>
                ) : null}
                <StatSparkline seed={item.id} color={sparkColor} data={item.sparkline} />
              </>
            );

            const cardClasses = [
              "relative shrink-0 snap-center w-[78vw] sm:w-[240px] md:w-[220px] lg:w-[200px] xl:w-[calc((100%-3*0.75rem)/4)] xl:min-w-[180px] rounded-xl border p-5 transition-all duration-300",
              active
                ? "border-primary/40 shadow-md ring-2 ring-primary/20 scale-[1.02]"
                : "border-border opacity-90 hover:opacity-100",
              item.cardClassName ?? "bg-card",
            ].join(" ");

            const card = (
              <motion.div
                key={item.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(item.id, el);
                  else cardRefs.current.delete(item.id);
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className={cardClasses}
                style={item.cardStyle}
                onClick={() => selectIndex(index)}
                role="group"
                aria-roledescription="slide"
                aria-label={`${item.label}: ${typeof item.value === "string" ? item.value : ""}`}
              >
                {item.href ? (
                  <Link to={item.href} className="block" onClick={(e) => e.stopPropagation()}>
                    {cardInner}
                  </Link>
                ) : (
                  cardInner
                )}
              </motion.div>
            );

            return card;
          })}
        </div>
      </div>

      {items.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5" aria-hidden>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Show ${item.label}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
