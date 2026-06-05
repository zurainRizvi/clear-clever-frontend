import type { CSSProperties } from "react";
import type { InsurerAnalyticsPayload } from "@/lib/insurer-api";

const REGION_PATHS: Record<string, { d: string; labelX: number; labelY: number }> = {
  punjab: {
    d: "M118 88 L168 72 L198 98 L188 138 L142 152 L108 128 Z",
    labelX: 148,
    labelY: 112,
  },
  sindh: {
    d: "M108 128 L142 152 L152 188 L118 208 L88 178 L92 142 Z",
    labelX: 118,
    labelY: 168,
  },
  balochistan: {
    d: "M28 108 L88 178 L118 208 L98 228 L42 210 L18 150 Z",
    labelX: 62,
    labelY: 178,
  },
  kpk: {
    d: "M118 88 L148 48 L178 58 L168 72 L118 88 Z",
    labelX: 142,
    labelY: 68,
  },
  islamabad: {
    d: "M148 48 L158 42 L166 52 L158 60 Z",
    labelX: 158,
    labelY: 52,
  },
  gb: {
    d: "M158 42 L188 28 L210 48 L198 58 L178 58 L158 42 Z",
    labelX: 184,
    labelY: 42,
  },
  ajk: {
    d: "M178 58 L210 48 L222 72 L198 98 L188 72 Z",
    labelX: 200,
    labelY: 72,
  },
};

interface PakistanUsersByRegionProps {
  data: InsurerAnalyticsPayload["usersByRegion"];
  cardStyle?: CSSProperties;
}

export function PakistanUsersByRegion({ data, cardStyle }: PakistanUsersByRegionProps) {
  const maxCount = Math.max(...data.regions.map((r) => r.userCount), 1);
  const countBySlug = new Map(data.regions.map((r) => [r.slug, r]));

  return (
    <section
      className="provider-portal-card border bg-white p-5 min-w-0"
      style={cardStyle}
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">{data.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{data.subtitle}</p>
      </div>

      {data.regions.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          Regional breakdown appears when seekers share city or location in questionnaires or purchases.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start min-w-0">
          <div className="relative rounded-2xl border border-slate-100 bg-slate-50/80 p-4 min-h-[240px]">
            <svg viewBox="0 0 240 240" className="w-full h-auto max-h-[280px] mx-auto" aria-hidden>
              <path
                d="M18 150 L28 108 L118 88 L168 72 L198 98 L222 72 L210 48 L188 28 L158 42 L148 48 L118 88 L108 128 L92 142 L88 178 L118 208 L152 188 L142 152 L188 138 L198 98 L222 72 L198 98 L188 138 L142 152 L108 128 L88 178 L42 210 L18 150 Z"
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth={1}
                opacity={0.35}
              />
              {Object.entries(REGION_PATHS).map(([slug, region]) => {
                const row = countBySlug.get(slug);
                const intensity = row ? 0.35 + (row.userCount / maxCount) * 0.55 : 0.08;
                const fill = row?.color ?? "#94A3B8";
                return (
                  <g key={slug}>
                    <path
                      d={region.d}
                      fill={fill}
                      fillOpacity={intensity}
                      stroke={fill}
                      strokeOpacity={0.7}
                      strokeWidth={1.2}
                    />
                    {row ? (
                      <>
                        <circle
                          cx={region.labelX}
                          cy={region.labelY}
                          r={11}
                          fill={row.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <text
                          x={region.labelX}
                          y={region.labelY + 4}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill="#fff"
                        >
                          {row.userCount}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <ul className="space-y-0 divide-y divide-slate-100 min-w-0">
            {data.regions.map((region) => (
              <li key={region.slug} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="text-sm font-semibold text-slate-800 truncate">{region.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{region.userCount}</p>
                  <p className="text-[11px] text-slate-500">
                    {region.userCount === 1 ? "user" : "users"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
