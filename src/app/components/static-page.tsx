import { MarketingPageShell } from "./marketing-page-shell";

export function StaticPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <MarketingPageShell title={title}>
      <p className="text-muted-foreground leading-relaxed">{body}</p>
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        ClearClever is a free insurance discovery platform. This page is placeholder content for
        demo and branding completeness.
      </div>
    </MarketingPageShell>
  );
}
