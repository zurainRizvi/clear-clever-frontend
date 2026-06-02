import { ClearCleverLogo } from "../auth/clearclever-logo";

export function SupportChatCta({
  onClick,
  disabled = false,
  label = "Chat with AI assistant",
  subtitle = "Get instant help, then reach our team if you need more.",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[280px] p-8 text-center">
      <ClearCleverLogo linkToHome={false} size="large" className="mb-6" />
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{subtitle}</p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full max-w-xs px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
