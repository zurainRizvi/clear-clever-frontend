import { Link } from "react-router";
import { InsurerLogo } from "./dashboard/insurer-logo";
import { MarketingPageShell } from "./marketing-page-shell";

export function AboutPage() {
  return (
    <MarketingPageShell title="About ClearClever">
      <p className="text-muted-foreground leading-relaxed">
        ClearClever is an AI-powered insurance marketplace for policy seekers and insurers. We help
        users discover suitable plans quickly while giving insurers actionable intelligence to improve
        offerings and conversions.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <article className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-2">AI for Policy Seekers</h3>
          <p className="text-sm text-muted-foreground">
            Smart recommendations based on needs, risk profile, and budget with clear side-by-side
            comparisons.
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-2">AI for Insurers</h3>
          <p className="text-sm text-muted-foreground">
            Demand trends, lead quality signals, and analytics insights that help optimize policy mix
            and pricing strategy.
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-2">Platform Vision</h3>
          <p className="text-sm text-muted-foreground">
            A trusted, transparent ecosystem where users buy with confidence and insurers grow with
            measurable insights.
          </p>
        </article>
      </div>
    </MarketingPageShell>
  );
}

const PARTNERS = [
  "HBL Insurance",
  "Jubilee Insurance",
  "Adamjee Insurance",
  "TPL Insurance",
  "Allianz",
  "EFU Life",
  "IGI General",
] as const;

export function PartnersPage() {
  return (
    <MarketingPageShell title="Partners">
      <p className="text-muted-foreground">
        We collaborate with trusted insurers to deliver broad coverage options, better transparency,
        and a smoother purchase journey for customers.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {PARTNERS.map((name) => (
          <article key={name} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <InsurerLogo companyName={name} className="h-8 w-auto max-w-[130px]" />
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">
                Partnered with ClearClever to offer discoverable insurance products and faster customer
                support workflows.
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="pt-2">
        <Link
          to="/contact-us"
          className="inline-flex px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Partnership with us
        </Link>
      </div>
    </MarketingPageShell>
  );
}
