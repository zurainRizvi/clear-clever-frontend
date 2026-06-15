import {
  Car,
  Flame,
  HeartPulse,
  Home,
  PawPrint,
  Shield,
  Sparkles,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { PolicyFeatureSection } from "@/lib/types";
import { filterMeaningfulSections } from "@/lib/policy-feature-utils";

const SECTION_ICONS: Record<string, LucideIcon> = {
  coverage: Shield,
  perils_covered: Flame,
  events_covered: Car,
  benefits: HeartPulse,
  conditions_covered: PawPrint,
  premium_breakdown: Sparkles,
  highlights: Umbrella,
  home: Home,
};

function iconForSection(section: PolicyFeatureSection): LucideIcon {
  return SECTION_ICONS[section.id] ?? Shield;
}

function iconForFeatureLabel(label: string): LucideIcon {
  const text = label.toLowerCase();
  if (text.includes("fire") || text.includes("flood") || text.includes("earthquake")) return Flame;
  if (text.includes("accident") || text.includes("vehicle") || text.includes("theft")) return Car;
  if (text.includes("pet") || text.includes("vet")) return PawPrint;
  if (text.includes("death") || text.includes("life") || text.includes("hospital")) return HeartPulse;
  if (text.includes("home") || text.includes("building")) return Home;
  return Shield;
}

function highlightRows(sections: PolicyFeatureSection[], features: string[]) {
  const meaningful = filterMeaningfulSections(sections);
  const rows: Array<{ label: string; detail?: string; included?: boolean }> = [];

  for (const section of meaningful) {
    for (const row of section.rows) {
      if (row.included === false) continue;
      rows.push({
        label: row.label,
        detail: row.value,
        included: row.included,
      });
      if (rows.length >= 4) return rows;
    }
  }

  for (const feature of features) {
    rows.push({ label: feature, included: true });
    if (rows.length >= 4) break;
  }

  return rows;
}

export function PolicyFeatureHighlights({
  sections,
  features,
  onViewAll,
}: {
  sections?: PolicyFeatureSection[];
  features: string[];
  onViewAll?: () => void;
}) {
  const items = highlightRows(sections ?? [], features);

  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        What&apos;s included
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((item, index) => {
          const Icon = iconForFeatureLabel(item.label);
          return (
            <motion.div
              key={`${item.label}-${index}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-3 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{item.label}</p>
                {item.detail ? (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
      {onViewAll ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all features
        </button>
      ) : null}
    </div>
  );
}

export function PolicyFeatureSectionIcon({ sectionId }: { sectionId: string }) {
  const Icon = SECTION_ICONS[sectionId] ?? Shield;
  return (
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
  );
}

export { iconForSection };
