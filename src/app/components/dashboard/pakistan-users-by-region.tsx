import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { InsurerAnalyticsPayload } from "@/lib/insurer-api";
import { PAKISTAN_MAP_VIEWBOX, PAKISTAN_REGION_PATHS } from "./pakistan-map-paths";
import { PAKISTAN_REGION_META } from "./pakistan-region-meta";

interface PakistanUsersByRegionProps {
  data: InsurerAnalyticsPayload["usersByRegion"];
  cardStyle?: CSSProperties;
  filters?: ReactNode;
}

export function PakistanUsersByRegion({ data, cardStyle, filters }: PakistanUsersByRegionProps) {
  const countBySlug = useMemo(() => {
    const map = new Map(data.regions.map((r) => [r.slug, r]));
    return map;
  }, [data.regions]);

  const legendRows = useMemo(() => {
    return PAKISTAN_REGION_META.map((meta) => {
      const row = countBySlug.get(meta.slug);
      return {
        slug: meta.slug,
        label: row?.label ?? meta.label,
        color: row?.color ?? meta.color,
        userCount: row?.userCount ?? 0,
        active: (row?.userCount ?? 0) > 0,
      };
    }).sort((a, b) => b.userCount - a.userCount || a.label.localeCompare(b.label));
  }, [countBySlug]);

  const maxCount = Math.max(...legendRows.map((r) => r.userCount), 1);
  const hasAnyUsers = legendRows.some((r) => r.active);

  return (
    <div className="space-y-4 min-w-0">
      {filters}
      <section
        className="provider-portal-card border bg-card p-5 min-w-0"
        style={cardStyle}
      >
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">{data.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{data.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,300px)] gap-8 items-center min-w-0">
        <div className="relative rounded-2xl border border-slate-100 dark:border-border bg-slate-50/80 dark:bg-muted/20 p-4 sm:p-6 min-h-[300px] flex items-center justify-center">
          <svg
            viewBox={PAKISTAN_MAP_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto max-h-[360px]"
            aria-label="Pakistan map by region"
          >
            {Object.entries(PAKISTAN_REGION_PATHS).map(([slug, region]) => {
              const row = countBySlug.get(slug);
              const active = (row?.userCount ?? 0) > 0;
              if (active && row) {
                const intensity = 0.5 + (row.userCount / maxCount) * 0.45;
                return (
                  <path
                    key={slug}
                    d={region.d}
                    fill={row.color}
                    fillOpacity={intensity}
                    stroke="#FFFFFF"
                    strokeWidth={1.75}
                    strokeLinejoin="round"
                  />
                );
              }
              return (
                <path
                  key={slug}
                  d={region.d}
                  fill="#E5E7EB"
                  fillOpacity={1}
                  stroke="#9CA3AF"
                  strokeWidth={1.25}
                  strokeLinejoin="round"
                  className="dark:fill-[#374151] dark:stroke-[#6B7280]"
                />
              );
            })}

            {Object.entries(PAKISTAN_REGION_PATHS).map(([slug, region]) => {
              const row = countBySlug.get(slug);
              if (!row || row.userCount <= 0) return null;
              return (
                <g key={`badge-${slug}`}>
                  <circle
                    cx={region.labelX}
                    cy={region.labelY}
                    r={14}
                    fill={row.color}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                  <text
                    x={region.labelX}
                    y={region.labelY + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill="#fff"
                  >
                    {row.userCount}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="min-w-0 w-full">
          {!hasAnyUsers ? (
            <p className="text-sm text-slate-500 py-4">
              Regional breakdown appears when seekers share city or location in questionnaires or purchases.
            </p>
          ) : null}
          <ul className="space-y-0 divide-y divide-slate-100 dark:divide-border min-w-0 w-full">
            {legendRows
              .filter((region) => region.active)
              .map((region) => (
                <li key={region.slug} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: region.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 leading-snug">{region.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {region.userCount} {region.userCount === 1 ? "user" : "users"}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
    </div>
  );
}
