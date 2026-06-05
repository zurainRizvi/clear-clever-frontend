import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Ban,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ShieldOff,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useProvider } from "./provider-context";
import { statusClass, titleCase } from "@/lib/provider-utils";
import { createConversation, fetchConversations } from "@/lib/messaging-api";
import {
  markInsurerLeadSeen,
  revokeInsurerPurchase,
  terminateInsurerPurchase,
  type InsurerCustomerGroup,
} from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";

function customerMatchesFilter(customer: InsurerCustomerGroup, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "new") return customer.isNew;
  if (filter === "purchases") return customer.purchases.length > 0;
  return customer.leads.some((lead) => lead.status === filter);
}

export function ProviderLeadsPage() {
  const { customers, loading, profile, refresh } = useProvider();
  const navigate = useNavigate();
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [actionPurchaseId, setActionPurchaseId] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (filter !== "new") return;
    const unseenLeads = customers.flatMap((customer) =>
      customer.leads.filter((lead) => lead.isNew)
    );
    if (unseenLeads.length === 0) return;
    void Promise.all(
      unseenLeads.map((lead) => markInsurerLeadSeen(lead.id).catch(() => undefined))
    ).then(() => refresh());
  }, [filter, customers, refresh]);

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => customerMatchesFilter(customer, filter)),
    [customers, filter]
  );

  const openConversation = async (customer: InsurerCustomerGroup) => {
    const seekerId = customer.seeker.id;
    if (!seekerId || !profile?.id) return;
    setContactingId(seekerId);
    try {
      const unseen = customer.leads.filter((lead) => lead.isNew);
      if (unseen.length > 0) {
        await Promise.all(unseen.map((lead) => markInsurerLeadSeen(lead.id).catch(() => undefined)));
      }
      const data = await fetchConversations();
      const existing = data.conversations.find(
        (conversation) =>
          conversation.type === "user_insurer" &&
          conversation.participants.some((participant) => participant.id === seekerId)
      );
      if (existing) {
        navigate("/provider-dashboard/messages", {
          state: { focusConversationId: existing.id },
        });
        return;
      }
      const created = await createConversation({
        type: "user_insurer",
        targetUserId: seekerId,
        insurerProfileId: profile.id,
        subject: `Customer: ${customer.seeker.fullName}`,
        initialMessage: `Hi ${customer.seeker.fullName}, thanks for your interest. How can we help?`,
      });
      navigate("/provider-dashboard/messages", {
        state: { focusConversationId: created.conversation.id },
      });
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open conversation");
    } finally {
      setContactingId(null);
    }
  };

  const handlePurchaseAction = async (
    purchaseId: string,
    action: "revoke" | "terminate"
  ) => {
    setActionPurchaseId(purchaseId);
    try {
      if (action === "revoke") {
        await revokeInsurerPurchase(purchaseId);
        toast.success("Purchase revoked. The policy seeker has been notified.");
      } else {
        await terminateInsurerPurchase(purchaseId);
        toast.success("Policy terminated. The policy seeker has been notified.");
      }
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update purchase");
    } finally {
      setActionPurchaseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Customer leads</h1>
        <p className="text-muted-foreground">
          Customers grouped by email with inquiries, favorites, and purchased policies
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "new", "purchases", "in_progress", "closed"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              filter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-accent"
            }`}
          >
            {value === "all"
              ? "All"
              : value === "purchases"
                ? "Purchases"
                : titleCase(value)}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {filteredCustomers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No customers in this view yet. Completed purchases and inquiries appear here automatically.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => {
              const expanded = expandedEmail === customer.seeker.email;
              const leadCount = customer.leads.length;
              const purchaseCount = customer.purchases.length;
              return (
                <div
                  key={customer.seeker.email}
                  className="rounded-xl border border-border bg-muted/20 overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {customer.seeker.fullName}
                        {customer.isNew ? (
                          <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-3 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.seeker.email}
                        </span>
                        {customer.seeker.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.seeker.phone}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {leadCount} lead{leadCount === 1 ? "" : "s"}
                        {purchaseCount > 0
                          ? ` · ${purchaseCount} purchased polic${purchaseCount === 1 ? "y" : "ies"}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEmail(expanded ? null : customer.seeker.email)
                        }
                        className="px-4 py-2 border border-border rounded-lg text-sm inline-flex items-center gap-2 hover:bg-accent"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View details
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={contactingId === customer.seeker.id}
                        onClick={() => void openConversation(customer)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {contactingId === customer.seeker.id ? "Opening…" : "Message"}
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="border-t border-border bg-card/80 p-4 space-y-4">
                      {customer.leads.length > 0 ? (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Lead activity</h3>
                          <div className="space-y-2">
                            {customer.leads.map((lead) => (
                              <div
                                key={lead.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                              >
                                <span className="font-medium">{titleCase(lead.type)}</span>
                                <span className="text-muted-foreground flex-1">
                                  {lead.summary || lead.policy?.name || "General inquiry"}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs w-fit ${statusClass(lead.status)}`}>
                                  {titleCase(lead.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {customer.purchases.length > 0 ? (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Purchased policies</h3>
                          <div className="space-y-2">
                            {customer.purchases.map((purchase) => (
                              <div
                                key={purchase.id}
                                className="rounded-lg border border-border px-3 py-3 text-sm space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium">{purchase.policy?.name ?? "Policy"}</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">
                                      {titleCase(purchase.status)}
                                      {purchase.completedAt
                                        ? ` · Completed ${new Date(purchase.completedAt).toLocaleDateString()}`
                                        : ""}
                                    </p>
                                  </div>
                                  {purchase.status === "completed" ? (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={actionPurchaseId === purchase.id}
                                        onClick={() =>
                                          void handlePurchaseAction(purchase.id, "revoke")
                                        }
                                        className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        Revoke
                                      </button>
                                      <button
                                        type="button"
                                        disabled={actionPurchaseId === purchase.id}
                                        onClick={() =>
                                          void handlePurchaseAction(purchase.id, "terminate")
                                        }
                                        className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-700 hover:bg-amber-500/10 inline-flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        <ShieldOff className="w-3.5 h-3.5" />
                                        Terminate
                                      </button>
                                    </div>
                                  ) : purchase.status === "terminated" ? (
                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                      No longer served
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
