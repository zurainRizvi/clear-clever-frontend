import { ClearCleverLogo } from "../auth/clearclever-logo";

export function SupportChatCta({
  onClick,
  disabled = false,
  label = "Chat with us",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[280px] p-8 text-center">
      <ClearCleverLogo linkToHome={false} size="large" className="mb-8" />
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
