import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  defaultProviderRange,
  formatProviderRangeLabel,
  matchesProviderPreset,
  providerRangeAllTime,
  providerRangeLastDays,
  type DateRangeValue,
} from "@/lib/provider-date-range";

function presetButtonClass(active: boolean): string {
  return active
    ? "text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md"
    : "text-xs text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground px-2 py-1";
}

export function ProviderDateRangePicker({
  value,
  onChange,
  className = "",
}: {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined = {
    from: value.from,
    to: value.to,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-white dark:bg-card text-sm text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-accent transition-colors shrink-0 ${className}`}
          style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 30px rgba(15,23,42,0.05)" }}
        >
          <CalendarIcon className="w-4 h-4 text-slate-500 dark:text-muted-foreground shrink-0" />
          <span className="whitespace-nowrap">{formatProviderRangeLabel(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              const from = new Date(range.from);
              const to = new Date(range.to);
              from.setHours(0, 0, 0, 0);
              to.setHours(23, 59, 59, 999);
              onChange({ from, to });
              setOpen(false);
            } else if (range?.from) {
              onChange({
                from: new Date(range.from),
                to: new Date(range.from),
              });
            }
          }}
          numberOfMonths={2}
          defaultMonth={value.from}
        />
        <div className="border-t p-2 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className={presetButtonClass(matchesProviderPreset(value, "7d"))}
            onClick={() => {
              onChange(defaultProviderRange());
              setOpen(false);
            }}
          >
            Last 7 days
          </button>
          <button
            type="button"
            className={presetButtonClass(matchesProviderPreset(value, "30d"))}
            onClick={() => {
              onChange(providerRangeLastDays(30));
              setOpen(false);
            }}
          >
            Last 30 days
          </button>
          <button
            type="button"
            className={presetButtonClass(matchesProviderPreset(value, "all"))}
            onClick={() => {
              onChange(providerRangeAllTime());
              setOpen(false);
            }}
          >
            All time
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
