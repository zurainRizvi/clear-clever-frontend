import { MessagesPanel } from "./messages-panel";

export function SupportPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Support</h1>
        <p className="text-muted-foreground">
          Chat with ClearClever support about policies, claims, or account help.
        </p>
      </div>
      <MessagesPanel autoStartSupport />
    </div>
  );
}
