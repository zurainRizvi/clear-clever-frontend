import { Link } from "react-router";
import { ClearCleverLogo } from "./auth/clearclever-logo";

export function StaticPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <ClearCleverLogo />
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{body}</p>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          ClearClever is a free insurance discovery platform. This page is placeholder content for
          demo and branding completeness.
        </div>
        <Link to="/" className="inline-flex text-primary hover:underline">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
