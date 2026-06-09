import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InsurerAnalyticsPayload } from "@/lib/insurer-api";
import { PROVIDER_THEME } from "./provider-portal-theme";
import type { InsurerCustomerDemographics } from "@/lib/insurer-api";

function SectionHeader({ title, definition }: { title: string; definition: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{definition}</p>
    </div>
  );
}

type Demo = InsurerAnalyticsPayload["customerDemographics"];

const GENDER_COLORS = ["#2563EB", "#EC4899", "#94A3B8"];

export function CustomerDemographicsSection({
  data,
  cardStyle,
}: {
  data: Demo;
  cardStyle: React.CSSProperties;
}) {
  const genderData = [
    { name: "Male", value: data.gender.male },
    { name: "Female", value: data.gender.female },
    { name: "Unknown", value: data.gender.unknown },
  ].filter((d) => d.value > 0);

  const ageData = [
    { band: "Under 18", count: data.ageBuckets.under18 },
    { band: "18–25", count: data.ageBuckets.age18to25 },
    { band: "26–35", count: data.ageBuckets.age26to35 },
    { band: "36–50", count: data.ageBuckets.age36to50 },
    { band: "50+", count: data.ageBuckets.age50plus },
    { band: "Unknown", count: data.ageBuckets.unknown },
  ].filter((d) => d.count > 0);

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
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Gender (CNIC-derived)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center text-xs text-slate-600">
              {genderData.map((d, i) => (
                <span key={d.name} className="inline-flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: GENDER_COLORS[i % GENDER_COLORS.length] }}
                  />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {ageData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Age bands</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="band" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                  <Tooltip />
                  <Bar dataKey="count" fill={PROVIDER_THEME.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {(data.topProvinces.length > 0 || data.topDistricts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topProvinces.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Top provinces</p>
              <ul className="space-y-1.5 text-sm">
                {data.topProvinces.map((row) => (
                  <li
                    key={row.province}
                    className="flex justify-between border-b border-slate-100 pb-1"
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
              <p className="text-sm font-medium text-slate-700 mb-2">Top districts</p>
              <ul className="space-y-1.5 text-sm">
                {data.topDistricts.map((row) => (
                  <li
                    key={`${row.province}-${row.district}`}
                    className="flex justify-between border-b border-slate-100 pb-1"
                  >
                    <span>
                      {row.district}
                      <span className="text-slate-400 text-xs ml-1">{row.province}</span>
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
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {data.expiredCnicCount} purchaser(s) have expired CNIC on record — consider renewal outreach.
        </p>
      )}
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
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
