import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { layoutSpring } from "@/lib/motion-presets";
import { PROVIDER_THEME } from "../dashboard/provider-portal-theme";

export interface PortalNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export type PortalNavTheme = "seeker" | "provider" | "admin";

interface PortalScrollNavProps {
  items: PortalNavItem[];
  isActive: (path: string) => boolean;
  theme?: PortalNavTheme;
  layoutId?: string;
}

const THEME_STYLES: Record<
  PortalNavTheme,
  { activeBg: string; activeText: string; badgeBg: string }
> = {
  seeker: {
    activeBg: "bg-sidebar-accent",
    activeText: "text-primary",
    badgeBg: "bg-primary",
  },
  provider: {
    activeBg: "",
    activeText: "",
    badgeBg: "",
  },
  admin: {
    activeBg: "bg-sidebar-accent",
    activeText: "text-primary",
    badgeBg: "bg-warning",
  },
};

export function PortalScrollNav({
  items,
  isActive,
  theme = "seeker",
  layoutId = "portal-nav-active",
}: PortalScrollNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const reducedMotion = useReducedMotion();
  const styles = THEME_STYLES[theme];
  const lastScrolledPath = useRef<string | null>(null);

  const activePath = useMemo(
    () => items.find((item) => isActive(item.path))?.path ?? items[0]?.path,
    [items, isActive]
  );

  const scrollToPath = useCallback(
    (path: string, behavior: ScrollBehavior = "smooth") => {
      const el = itemRefs.current.get(path);
      if (!el || !scrollRef.current) return;
      el.scrollIntoView({ inline: "center", block: "nearest", behavior });
    },
    []
  );

  useEffect(() => {
    if (!activePath || activePath === lastScrolledPath.current) return;
    lastScrolledPath.current = activePath;
    scrollToPath(activePath, reducedMotion ? "auto" : "smooth");
  }, [activePath, reducedMotion, scrollToPath]);

  return (
    <div className="relative border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
      <LayoutGroup id={layoutId}>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.path === activePath;
            const isProvider = theme === "provider";

            return (
              <Link
                key={item.path}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.path, el);
                  else itemRefs.current.delete(item.path);
                }}
                to={item.path}
                className={`relative flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  active
                    ? isProvider
                      ? "text-white"
                      : styles.activeText
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
                style={
                  active && isProvider
                    ? { backgroundColor: PROVIDER_THEME.primary }
                    : undefined
                }
                aria-current={active ? "page" : undefined}
              >
                {active && !isProvider ? (
                  <motion.span
                    layoutId={layoutId}
                    className={`absolute inset-0 rounded-full ${styles.activeBg}`}
                    transition={layoutSpring}
                    style={{ zIndex: 0 }}
                  />
                ) : null}
                {active && isProvider ? (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: PROVIDER_THEME.primary, zIndex: 0 }}
                    transition={layoutSpring}
                  />
                ) : null}
                <motion.span
                  className="relative z-[1] flex items-center gap-2"
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${
                        isProvider ? "" : styles.badgeBg
                      }`}
                      style={isProvider ? { backgroundColor: "#1D4ED8" } : undefined}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
