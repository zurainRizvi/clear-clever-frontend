import type { ReactNode } from "react";

/** Constrains chat UIs to viewport height so message threads scroll inside the panel, not the page. */
export function ChatShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col flex-1 min-h-0 max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100vh-8rem)] ${className}`}
    >
      {children}
    </div>
  );
}
