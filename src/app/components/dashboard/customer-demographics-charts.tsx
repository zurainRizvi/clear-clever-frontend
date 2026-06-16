import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InsurerAnalyticsPayload } from "@/lib/insurer-api";
import { PROVIDER_THEME } from "./provider-portal-theme";
import type { InsurerCustomerDemographics } from "@/lib/insurer-api";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function SectionHeader({ title, definition }: { title: string; definition: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">{title}</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-slate-400 cursor-help inline-flex"
              aria-label={`About ${title}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border">
            {definition}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

type Demo = InsurerAnalyticsPayload["customerDemographics"];

const GENDER_COLORS: Record<string, string> = {
  Male: "#2563EB",
  Female: "#EC4899",
  "Not yet verified": "#64748B",
};

const AGE_BAND_COLORS: Record<string, string> = {
  "Under 18": "#6366F1",
  "18–25": "#8B5CF6",
  "26–35": "#06B6D4",
  "36–50": "#F59E0B",
  "50+": "#10B981",
  "Not yet verified": "#94A3B8",
};

function InsightNote({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "success" }) {
  return (
    <p
      className={`text-xs rounded-lg px-3 py-2 border leading-relaxed ${
        tone === "success"
          ? "bg-emerald-50/80 border-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300"
          : "bg-slate-50/80 border-slate-100 text-slate-600 dark:bg-muted/30 dark:border-border dark:text-muted-foreground"
      }`}
    >
      {children}
    </p>
  );
}

export function CustomerDemographicsSection({
  data,
  cardStyle,
}: {
  data: Demo;
  cardStyle: React.CSSProperties;
}) {
  const genderTotal = data.gender.male + data.gender.female + data.gender.unknown;
  const genderData = [
    { name: "Male", value: data.gender.male },
    { name: "Female", value: data.gender.female },
    { name: "Not yet verified", value: data.gender.unknown },
  ].filter((d) => d.value > 0);

  const ageEntries = [
    { band: "Under 18", count: data.ageBuckets.under18 },
    { band: "18–25", count: data.ageBuckets.age18to25 },
    { band: "26–35", count: data.ageBuckets.age26to35 },
    { band: "36–50", count: data.ageBuckets.age36to50 },
    { band: "50+", count: data.ageBuckets.age50plus },
    { band: "Not yet verified", count: data.ageBuckets.unknown },
  ].filter((d) => d.count > 0);

  const ageTotal = ageEntries.reduce((sum, row) => sum + row.count, 0);
  const ageData = ageEntries.map((row) => ({
    ...row,
    pct: ageTotal > 0 ? Math.round((row.count / ageTotal) * 100) : 0,
    label: `${row.count} (${ageTotal > 0 ? Math.round((row.count / ageTotal) * 100) : 0}%)`,
  }));

  const unknownGenderPct =
    genderTotal > 0 ? Math.round((data.gender.unknown / genderTotal) * 100) : 0;
  const unknownAgePct = ageTotal > 0 ? Math.round((data.ageBuckets.unknown / ageTotal) * 100) : 0;

  return (
    <section
      className="provider-portal-card rounded-2xl border bg-card p-5 space-y-5"
      style={cardStyle}
    >
      <SectionHeader title={data.title} definition={data.subtitle} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Purchasers" value={String(data.totalPurchasers)} />
        <KpiCard label="KYC verified" value={data.kycVerifiedRate} />
        <KpiCard label="Adult rate" value={data.adultRate} />
        <KpiCard
          label="Avg KYC score"
          value={data.verificationQuality.avgKycScoreFormatted}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {genderData.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-foreground">
              Gender (CNIC-derived)
            </p>
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={GENDER_COLORS[entry.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [
                      `${value} (${genderTotal > 0 ? Math.round((value / genderTotal) * 100) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-foreground">
                  {genderTotal}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  purchasers
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-center text-xs text-slate-600 dark:text-muted-foreground">
              {genderData.map((d) => (
                <span key={d.name} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: GENDER_COLORS[d.name] ?? "#94A3B8" }}
                  />
                  {d.name}: {d.value}
                  <span className="text-muted-foreground">
                    ({genderTotal > 0 ? Math.round((d.value / genderTotal) * 100) : 0}%)
                  </span>
                </span>
              ))}
            </div>
            {data.gender.unknown > 0 ? (
              <InsightNote>
                {data.gender.unknown} purchaser{data.gender.unknown === 1 ? "" : "s"} ({unknownGenderPct}
                %) have no verified CNIC on file — gender is inferred from KYC document extraction,
                not purchase forms.
              </InsightNote>
            ) : (
              <InsightNote tone="success">
                All purchasers in this period have CNIC-derived gender data on file.
              </InsightNote>
            )}
          </div>
        )}

        {ageData.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-foreground">Age bands</p>
            <div className="h-56 rounded-xl border border-slate-100 dark:border-border bg-gradient-to-br from-slate-50/80 to-white dark:from-muted/20 dark:to-card p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageData}
                  layout="vertical"
                  margin={{ top: 4, right: 56, left: 4, bottom: 0 }}
                >
                  <XAxis type="number" hide domain={[0, "dataMax"]} />
                  <YAxis
                    type="category"
                    dataKey="band"
                    width={100}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value} purchasers`, "Count"]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{ borderRadius: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} maxBarSize={24}>
                    {ageData.map((row) => (
                      <Cell
                        key={row.band}
                        fill={AGE_BAND_COLORS[row.band] ?? PROVIDER_THEME.primary}
                      />
                    ))}
                    <LabelList
                      dataKey="label"
                      position="right"
                      className="fill-slate-600 dark:fill-muted-foreground"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center text-xs text-slate-600 dark:text-muted-foreground">
              {ageData.map((row) => (
                <span key={row.band} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: AGE_BAND_COLORS[row.band] ?? PROVIDER_THEME.primary }}
                  />
                  {row.band}
                </span>
              ))}
            </div>
            {data.ageBuckets.unknown > 0 ? (
              <InsightNote>
                {data.ageBuckets.unknown} purchaser{data.ageBuckets.unknown === 1 ? "" : "s"} (
                {unknownAgePct}%) could not be age-banded — they have not completed AI KYC with a
                readable date of birth on their CNIC.
              </InsightNote>
            ) : (
              <InsightNote tone="success">
                Every purchaser in this period has a CNIC-derived age band.
              </InsightNote>
            )}
          </div>
        )}
      </div>

      {(data.topProvinces.length > 0 || data.topDistricts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topProvinces.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-foreground mb-2">
                Top provinces
              </p>
              <ul className="space-y-1.5 text-sm">
                {data.topProvinces.map((row) => (
                  <li
                    key={row.province}
                    className="flex justify-between border-b border-slate-100 dark:border-border pb-1"
                  >
                    <span>{row.province}</span>
                    <span className="font-medium tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.topDistricts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-foreground mb-2">
                Top districts
              </p>
              <ul className="space-y-1.5 text-sm">
                {data.topDistricts.map((row) => (
                  <li
                    key={`${row.province}-${row.district}`}
                    className="flex justify-between border-b border-slate-100 dark:border-border pb-1"
                  >
                    <span>
                      {row.district}
                      <span className="text-slate-400 dark:text-muted-foreground text-xs ml-1">
                        {row.province}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.expiredCnicCount > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg px-3 py-2">
          {data.expiredCnicCount} purchaser(s) have expired CNIC on record — consider renewal
          outreach.
        </p>
      )}
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-border bg-slate-50/80 dark:bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-900 dark:text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export function CustomerDemographicsChips({
  demographics,
}: {
  demographics?: InsurerCustomerDemographics;
}) {
  if (!demographics || demographics.kycStatus === "none") return null;

  const chips: string[] = [];
  if (demographics.gender) chips.push(demographics.gender === "male" ? "Male" : "Female");
  if (demographics.ageBand) chips.push(demographics.ageBand);
  if (demographics.district) chips.push(demographics.district);
  if (demographics.kycStatus === "verified") chips.push("KYC verified");
  else if (demographics.kycScore) chips.push(`KYC ${demographics.kycScore}`);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
