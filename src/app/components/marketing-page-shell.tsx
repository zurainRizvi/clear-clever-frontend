import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ClearCleverLogo } from "./auth/clearclever-logo";
import { DarkModeToggle } from "./dark-mode-toggle";

export function MarketingPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <ClearCleverLogo />
          <DarkModeToggle className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-accent" />
        </div>
        <h1 className="text-4xl font-bold">{title}</h1>
        {children}
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
