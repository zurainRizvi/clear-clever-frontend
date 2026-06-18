import logoAdamjee from "@/assets/landing/partners/adamjee.svg";
import logoAllianz from "@/assets/landing/partners/allianz.svg";
import logoEfu from "@/assets/landing/partners/efu-life.svg";
import logoHbl from "@/assets/landing/partners/hbl.svg";
import logoIgi from "@/assets/landing/partners/igi.svg";
import logoJubilee from "@/assets/landing/partners/jubilee.svg";
import logoTpl from "@/assets/landing/partners/tpl.svg";
import { cn } from "../ui/utils";

export interface InsurerImageIdentity {
  companyName?: string;
  profilePhotoDataUrl?: string | null;
}

const LOGO_MAP: Record<string, string> = {
  adamjee: logoAdamjee,
  allianz: logoAllianz,
  efu: logoEfu,
  hbl: logoHbl,
  igi: logoIgi,
  jubilee: logoJubilee,
  tpl: logoTpl,
};

const FALLBACK_PALETTES = [
  { bg: "#E8F7F0", border: "#0F8A5F", text: "#075A3E" },
  { bg: "#EAF1FF", border: "#2563EB", text: "#1E3A8A" },
  { bg: "#FFF4E6", border: "#D97706", text: "#92400E" },
  { bg: "#F0F9FF", border: "#0284C7", text: "#075985" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#4C1D95" },
];

function normalizeName(name?: string): string {
  return name?.trim() || "Insurance Partner";
}

function initialsFromCompanyName(name: string): string {
  const ignored = new Set(["insurance", "general", "company", "limited", "ltd", "life"]);
  const parts = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/gi, ""))
    .filter((part) => part && !ignored.has(part.toLowerCase()));

  return (parts.length ? parts : name.split(/\s+/))
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fallbackInsurerLogoSrc(companyName?: string): string {
  const name = normalizeName(companyName);
  const initials = initialsFromCompanyName(name);
  const palette =
    FALLBACK_PALETTES[
      [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_PALETTES.length
    ];
  const label = escapeSvgText(name.length > 24 ? `${name.slice(0, 21)}...` : name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 104" role="img" aria-label="${label}">
  <rect width="180" height="104" rx="22" fill="${palette.bg}"/>
  <rect x="8" y="8" width="164" height="88" rx="18" fill="white" stroke="${palette.border}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="90" y="51" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${palette.text}">${escapeSvgText(initials)}</text>
  <text x="90" y="74" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="${palette.text}">${label}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveIdentity(
  input?: string | InsurerImageIdentity,
  profilePhotoDataUrl?: string | null
): InsurerImageIdentity {
  if (typeof input === "string") {
    return { companyName: input, profilePhotoDataUrl };
  }
  return input ?? { profilePhotoDataUrl };
}

export function insurerLogoSrc(
  input?: string | InsurerImageIdentity,
  profilePhotoDataUrl?: string | null
): string {
  const identity = resolveIdentity(input, profilePhotoDataUrl);
  if (identity.profilePhotoDataUrl) return identity.profilePhotoDataUrl;

  const key = normalizeName(identity.companyName).toLowerCase();
  const matched = Object.entries(LOGO_MAP).find(([name]) => key.includes(name))?.[1];
  return matched ?? fallbackInsurerLogoSrc(identity.companyName);
}

export function InsurerLogo({
  insurer,
  companyName,
  profilePhotoDataUrl,
  className,
}: {
  insurer?: InsurerImageIdentity;
  companyName?: string;
  profilePhotoDataUrl?: string | null;
  className?: string;
}) {
  const identity = insurer ?? { companyName, profilePhotoDataUrl };
  const src = insurerLogoSrc(identity);
  const label = normalizeName(identity.companyName);

  return (
    <img
      src={src}
      alt={label}
      className={cn("h-10 w-28 object-contain object-center", className)}
    />
  );
}
