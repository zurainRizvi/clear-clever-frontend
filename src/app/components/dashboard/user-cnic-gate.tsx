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
        <h2 className="font-semibold text-lg">CNIC required for claims</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add your Pakistan CNIC and optionally upload a photo for AI identity verification before
          filing a claim.
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
