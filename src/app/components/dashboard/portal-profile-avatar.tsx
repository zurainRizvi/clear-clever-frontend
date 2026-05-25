import { User } from "lucide-react";
import { useAuth } from "../auth-context";

export function PortalProfileAvatar({
  sizeClass = "w-10 h-10",
  className = "",
}: {
  sizeClass?: string;
  className?: string;
}) {
  const { user, userName } = useAuth();
  const photo = user?.profile?.profilePhotoDataUrl;
  const initials =
    userName
      ?.split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  if (photo) {
    return (
      <img
        src={photo}
        alt="Profile"
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${className}`}
    >
      {initials !== "?" ? (
        <span className="text-xs font-semibold text-primary">{initials}</span>
      ) : (
        <User className="w-5 h-5 text-primary" />
      )}
    </div>
  );
}
