import { Link } from "react-router";
import { Shield } from "lucide-react";

export function ClearCleverLogo({
  linkToHome = true,
  size = "default",
  className = "",
}: {
  linkToHome?: boolean;
  size?: "default" | "large";
  className?: string;
}) {
  const iconBox =
    size === "large" ? "w-14 h-14 rounded-2xl" : "w-10 h-10 rounded-xl";
  const icon = size === "large" ? "w-8 h-8" : "w-6 h-6";
  const text = size === "large" ? "text-3xl" : "text-xl";

  const content = (
    <>
      <div
        className={`${iconBox} bg-primary flex items-center justify-center shrink-0`}
      >
        <Shield className={`${icon} text-primary-foreground`} />
      </div>
      <span className={`font-bold font-[Poppins] ${text}`}>ClearClever</span>
    </>
  );

  if (linkToHome) {
    return (
      <Link to="/" className={`inline-flex items-center gap-3 ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center gap-3 ${className}`}>{content}</div>;
}
