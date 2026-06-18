import { X } from "lucide-react";
import type { PublicPolicy } from "@/lib/types";
import { InsurerLogo } from "./insurer-logo";

interface PolicyCompareBarProps {
  selected: PublicPolicy[];
  maxCount: number;
  onRemove: (policyId: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

export function PolicyCompareBar({
  selected,
  maxCount,
  onRemove,
  onClear,
  onCompare,
}: PolicyCompareBarProps) {
  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <InsurerLogo
                insurer={policy.insurer}
                className="h-10 w-14 rounded-md border border-border bg-background p-1"
              />
              <div className="min-w-0">
                <p className="font-medium truncate max-w-[140px]">{policy.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {policy.insurer.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(policy.id)}
                className="p-1 rounded hover:bg-accent"
                aria-label={`Remove ${policy.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-primary hover:underline px-2"
          >
            Clear all
          </button>
        </div>
        <button
          type="button"
          disabled={selected.length < 2}
          onClick={onCompare}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Compare {selected.length} of {maxCount} policies
        </button>
      </div>
    </div>
  );
}
