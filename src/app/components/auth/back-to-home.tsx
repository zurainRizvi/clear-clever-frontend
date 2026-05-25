import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function BackToHomeLink({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to home
    </Link>
  );
}
