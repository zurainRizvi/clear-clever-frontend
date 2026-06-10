import { useAuth } from "../auth-context";
import { CnicKycPanel } from "./cnic-kyc-panel";

export function UserCnicGate({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { refreshUser } = useAuth();

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-4">
        <h2 className="font-semibold text-lg">Strengthen your claims with CNIC</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Adding your Pakistan CNIC helps insurers verify you faster. You can still file a claim
          without it, but approval confidence is usually lower until identity is on file.
        </p>
      </div>
      <CnicKycPanel
        onCnicSaved={() => {
          void refreshUser();
          onSaved();
        }}
        onKycUpdated={() => void refreshUser()}
      />
    </div>
  );
}
