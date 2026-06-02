export const PROVIDER_THEME = {
  bg: "var(--background)",
  card: "var(--card)",
  border: "var(--border)",
  borderAlt: "var(--border)",
  primary: "#2563EB",
  shadow: "0 8px 30px rgba(15,23,42,0.05)",
  radius: "22px",
} as const;

export const PROVIDER_PAGE_CLASS =
  "w-full max-w-full min-w-0 overflow-x-hidden space-y-5 text-[13px] sm:text-sm dark:[&_\\.bg-white]:!bg-card dark:[&_\\.text-slate-900]:!text-foreground dark:[&_\\.text-slate-800]:!text-foreground dark:[&_\\.text-slate-700]:!text-muted-foreground dark:[&_\\.text-slate-600]:!text-muted-foreground dark:[&_\\.text-slate-500]:!text-muted-foreground dark:[&_\\.border]:!border-border dark:[&_\\.bg-slate-50]:!bg-muted/20 dark:[&_\\.bg-slate-100]:!bg-muted/30";
