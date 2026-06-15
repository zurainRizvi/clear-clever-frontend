import { Building2 } from "lucide-react";
import { insurerLogoSrc } from "./insurer-logo";

const SIZE_CLASS = {
  sm: "w-9 h-9",
  md: "w-12 h-12",
  lg: "w-14 h-14",
} as const;

const IMG_CLASS = {
  sm: "max-h-[70%] max-w-[78%]",
  md: "max-h-[72%] max-w-[80%]",
  lg: "max-h-[74%] max-w-[82%]",
} as const;

export function InsurerAvatar({
  companyName,
  size = "md",
  className = "",
}: {
  companyName?: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const src = insurerLogoSrc(companyName);

  return (
    <div
      className={`${SIZE_CLASS[size]} rounded-full border border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${className}`}
      title={companyName}
    >
      {src ? (
        <img
          src={src}
          alt={companyName ?? "Insurer"}
          className={`${IMG_CLASS[size]} object-contain`}
        />
      ) : (
        <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
