import { SlidersHorizontal } from "lucide-react";
import type { CompareResultsFilters, CompareSortOption, ScoredRecommendation } from "@/lib/types";
import { uniqueInsurersFromRecommendations } from "@/lib/compare-results-utils";

interface PolicyResultsToolbarProps {
  recommendations: ScoredRecommendation[];
  sort: CompareSortOption;
  filters: CompareResultsFilters;
  categorySlug?: string;
  filtersOpen: boolean;
  onSortChange: (sort: CompareSortOption) => void;
  onFiltersChange: (filters: CompareResultsFilters) => void;
  onToggleFilters: () => void;
  filteredCount: number;
}

const SORT_OPTIONS: Array<{ value: CompareSortOption; label: string }> = [
  { value: "best_match", label: "Best match" },
  { value: "economical", label: "Economical" },
  { value: "premium", label: "Premium" },
];

export function PolicyResultsToolbar({
  recommendations,
  sort,
  filters,
  categorySlug,
  filtersOpen,
  onSortChange,
  onFiltersChange,
  onToggleFilters,
  filteredCount,
}: PolicyResultsToolbarProps) {
  const insurers = uniqueInsurersFromRecommendations(recommendations);

  const toggleInsurer = (insurerId: string) => {
    const next = filters.insurerIds.includes(insurerId)
      ? filters.insurerIds.filter((id) => id !== insurerId)
      : [...filters.insurerIds, insurerId];
    onFiltersChange({ ...filters, insurerIds: next });
  };

  const togglePolicyType = (type: "conventional" | "islamic") => {
    const next = filters.policyTypes.includes(type)
      ? filters.policyTypes.filter((item) => item !== type)
      : [...filters.policyTypes, type];
    onFiltersChange({ ...filters, policyTypes: next });
  };

  return (
    <div className="mb-6 flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Sort by</span>
        {SORT_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
              sort === option.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:bg-accent"
            }`}
          >
            <input
              type="radio"
              name="compare-sort"
              className="sr-only"
              checked={sort === option.value}
              onChange={() => onSortChange(option.value)}
            />
            {option.label}
          </label>
        ))}
        <button
          type="button"
          onClick={onToggleFilters}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {filtersOpen ? "Hide filters" : "Filter by"}
        </button>
        <span className="text-sm text-muted-foreground">
          Showing {filteredCount} of {recommendations.length}
        </span>
      </div>

      {filtersOpen ? (
        <aside className="lg:w-72 rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filter by insurer</h3>
            {(filters.insurerIds.length > 0 ||
              filters.policyTypes.length > 0 ||
              filters.trackerFilter !== "all") && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() =>
                  onFiltersChange({
                    insurerIds: [],
                    policyTypes: [],
                    trackerFilter: "all",
                  })
                }
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {insurers.map((insurer) => (
              <label key={insurer.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.insurerIds.includes(insurer.id)}
                  onChange={() => toggleInsurer(insurer.id)}
                />
                {insurer.name}
              </label>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Policy type
            </h4>
            <div className="space-y-2">
              {(["conventional", "islamic"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={filters.policyTypes.includes(type)}
                    onChange={() => togglePolicyType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {categorySlug === "auto" ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Tracker
              </h4>
              <select
                value={filters.trackerFilter}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    trackerFilter: event.target.value as CompareResultsFilters["trackerFilter"],
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All policies</option>
                <option value="mandatory">Tracker mandatory</option>
                <option value="optional">Tracker optional</option>
                <option value="none">No tracker required</option>
              </select>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
