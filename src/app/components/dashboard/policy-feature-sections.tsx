import { Check, Minus } from "lucide-react";
import type { PolicyFeatureSection } from "@/lib/types";

interface PolicyFeatureSectionsProps {
  sections: PolicyFeatureSection[];
  compact?: boolean;
  highlightDifferences?: boolean;
  columnIndex?: number;
  compareColumns?: PolicyFeatureSection[][];
}

function rowValue(row: PolicyFeatureSection["rows"][number]): string {
  if (row.included === true) return "included";
  if (row.included === false) return "excluded";
  return row.value ?? "—";
}

export function PolicyFeatureSections({
  sections,
  compact = false,
}: PolicyFeatureSectionsProps) {
  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Detailed feature breakdown is not available.</p>
    );
  }

  return (
    <div className={`space-y-${compact ? "4" : "5"}`}>
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border border-border overflow-hidden bg-card"
        >
          <header className="px-4 py-3 bg-muted/40 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
          </header>
          <div className="divide-y divide-border">
            {section.rows.map((row, index) => (
              <div
                key={row.key}
                className={`grid grid-cols-1 sm:grid-cols-2 gap-1 px-4 py-3 ${
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                <span className="text-sm font-medium text-foreground">{row.label}</span>
                <span className="text-sm text-muted-foreground sm:text-right">
                  {row.included !== undefined ? (
                    <span className="inline-flex items-center gap-1.5 sm:justify-end">
                      {row.included ? (
                        <>
                          <Check className="w-4 h-4 text-success shrink-0" aria-hidden />
                          <span className="text-foreground">Included</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-4 h-4 text-muted-foreground/60 shrink-0" aria-hidden />
                          <span>Not included</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-foreground font-medium">{row.value ?? "—"}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function getAllSectionIds(columns: PolicyFeatureSection[][]): string[] {
  const ids = new Set<string>();
  for (const sections of columns) {
    for (const section of sections) {
      ids.add(section.id);
    }
  }
  return [...ids];
}

export function findSection(
  sections: PolicyFeatureSection[] | undefined,
  sectionId: string
): PolicyFeatureSection | undefined {
  return sections?.find((section) => section.id === sectionId);
}

export function rowsMatchAcrossColumns(
  columns: PolicyFeatureSection[][],
  sectionId: string,
  rowKey: string
): boolean {
  const values = columns.map((sections) => {
    const section = findSection(sections, sectionId);
    const row = section?.rows.find((r) => r.key === rowKey);
    return row ? rowValue(row) : null;
  });
  return values.every((value) => value === values[0]);
}
