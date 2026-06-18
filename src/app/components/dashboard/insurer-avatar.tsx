import { Building2 } from "lucide-react";
import { cn } from "../ui/utils";
import { insurerLogoSrc, type InsurerImageIdentity } from "./insurer-logo";

const SIZE_CLASS = {
  sm: "w-11 h-11",
  md: "w-14 h-14",
  lg: "w-16 h-16",
} as const;

const IMG_CLASS = {
  sm: "w-[118%] max-w-none max-h-[64%]",
  md: "w-[120%] max-w-none max-h-[66%]",
  lg: "w-[122%] max-w-none max-h-[68%]",
} as const;

export function InsurerAvatar({
  insurer,
  companyName,
  profilePhotoDataUrl,
  size = "md",
  className = "",
}: {
  insurer?: InsurerImageIdentity;
  companyName?: string;
  profilePhotoDataUrl?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const identity = insurer ?? { companyName, profilePhotoDataUrl };
  const src = insurerLogoSrc(identity);

  return (
    <div
      className={cn(
        SIZE_CLASS[size],
        "rounded-full border border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-sm",
        className
      )}
      title={identity.companyName}
    >
      {src ? (
        <img
          src={src}
          alt={identity.companyName ?? "Insurer"}
          className={cn(IMG_CLASS[size], "object-contain object-center")}
        />
      ) : (
        <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
