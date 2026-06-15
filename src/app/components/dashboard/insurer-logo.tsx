import logoAdamjee from "@/assets/landing/partners/adamjee.svg";
import logoAllianz from "@/assets/landing/partners/allianz.svg";
import logoEfu from "@/assets/landing/partners/efu-life.svg";
import logoHbl from "@/assets/landing/partners/hbl.svg";
import logoIgi from "@/assets/landing/partners/igi.svg";
import logoJubilee from "@/assets/landing/partners/jubilee.svg";
import logoTpl from "@/assets/landing/partners/tpl.svg";

const LOGO_MAP: Record<string, string> = {
  adamjee: logoAdamjee,
  allianz: logoAllianz,
  efu: logoEfu,
  hbl: logoHbl,
  igi: logoIgi,
  jubilee: logoJubilee,
  tpl: logoTpl,
};

export function insurerLogoSrc(companyName?: string): string | undefined {
  const key = (companyName ?? "").toLowerCase();
  return Object.entries(LOGO_MAP).find(([name]) => key.includes(name))?.[1];
}

export function InsurerLogo({
  companyName,
  className = "h-7 w-auto max-w-[110px]",
}: {
  companyName?: string;
  className?: string;
}) {
  const src = insurerLogoSrc(companyName);

  if (!src) {
    return (
      <div className="inline-flex items-center rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
        Partner
      </div>
    );
  }

  return <img src={src} alt={companyName ?? "Insurer"} className={className} />;
}
