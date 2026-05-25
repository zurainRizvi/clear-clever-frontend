import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  defaultProviderRange,
  formatProviderRangeLabel,
  type DateRangeValue,
} from "@/lib/provider-date-range";

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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors shrink-0 ${className}`}
          style={{ borderColor: "#E5E7EB", boxShadow: "0 8px 30px rgba(15,23,42,0.05)" }}
        >
          <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
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
        <div className="border-t p-2 flex justify-between gap-2">
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
            onClick={() => {
              onChange(defaultProviderRange());
              setOpen(false);
            }}
          >
            Last 7 days
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
