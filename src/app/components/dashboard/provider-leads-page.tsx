import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { AnimatedPillTabs } from "../ui/animated-pill-tabs";
import { fadeUpItem } from "@/lib/motion-presets";
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
  ShoppingBag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useProvider } from "./provider-context";
import { statusClass, titleCase } from "@/lib/provider-utils";
import { createConversation, fetchConversations } from "@/lib/messaging-api";
import {
  revokeInsurerPurchase,
  terminateInsurerPurchase,
  type InsurerCustomerGroup,
  type InsurerCustomerPurchaseSummary,
} from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";
import { ActionConfirmDialog } from "./action-confirm-dialog";
import { CustomerDemographicsChips } from "./customer-demographics-charts";

function customerMatchesFilter(customer: InsurerCustomerGroup, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "new") return customer.isNew;
  if (filter === "purchases") return customer.purchases.length > 0;
  return customer.leads.some((lead) => lead.status === filter);
}

function PurchasedPolicyRow({
  purchase,
  busy,
  onRevoke,
  onTerminate,
}: {
  purchase: InsurerCustomerPurchaseSummary;
  busy: boolean;
  onRevoke: (purchaseId: string) => void;
  onTerminate: (purchaseId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-3 text-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">{purchase.policy?.name ?? "Policy"}</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {titleCase(purchase.status)}
              {purchase.completedAt
                ? ` · Completed ${new Date(purchase.completedAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        </div>
        {purchase.status === "completed" ? (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={() => onRevoke(purchase.id)}
              className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              Revoke
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onTerminate(purchase.id)}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Terminate
            </button>
          </div>
        ) : purchase.status === "terminated" ? (
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-full shrink-0">
            No longer served
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ProviderLeadsPage() {
  const { customers, loading, profile, refresh, markLeadsSeen, unseenNewLeadsCount } =
    useProvider();
  const navigate = useNavigate();
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [actionPurchaseId, setActionPurchaseId] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState<{
    purchaseId: string;
    action: "revoke" | "terminate";
    policyName: string;
  } | null>(null);

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => customerMatchesFilter(customer, filter)),
    [customers, filter]
  );

  const toggleLeadActivity = async (customer: InsurerCustomerGroup) => {
    const willExpand = expandedEmail !== customer.seeker.email;
    setExpandedEmail(willExpand ? customer.seeker.email : null);
    if (!willExpand) return;

    const unseenIds = customer.leads.filter((lead) => lead.isNew).map((lead) => lead.id);
    if (unseenIds.length > 0) {
      await markLeadsSeen(unseenIds);
    }
  };

  const openConversation = async (customer: InsurerCustomerGroup) => {
    const seekerId = customer.seeker.id;
    if (!seekerId || !profile?.id) return;
    setContactingId(seekerId);
    try {
      const unseenIds = customer.leads.filter((lead) => lead.isNew).map((lead) => lead.id);
      if (unseenIds.length > 0) {
        await markLeadsSeen(unseenIds);
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open conversation");
    } finally {
      setContactingId(null);
    }
  };

  const runPurchaseAction = async () => {
    if (!pendingAction) return;
    setActionPurchaseId(pendingAction.purchaseId);
    try {
      if (pendingAction.action === "revoke") {
        await revokeInsurerPurchase(pendingAction.purchaseId);
        toast.success("Purchase revoked. The policy seeker has been notified.");
      } else {
        await terminateInsurerPurchase(pendingAction.purchaseId);
        toast.success("Policy terminated. The policy seeker has been notified.");
      }
      setPendingAction(null);
      await refresh({ silent: true });
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

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "new", label: unseenNewLeadsCount > 0 ? `New (${unseenNewLeadsCount})` : "New" },
    { id: "purchases", label: "Purchases" },
    { id: "in_progress", label: "In progress" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Leads &amp; customers</h1>
        <p className="text-muted-foreground">
          Customers grouped by email with lead activity and purchased policies you can revoke or terminate
        </p>
      </div>

      <AnimatedPillTabs
        tabs={filterTabs}
        activeId={filter}
        onChange={setFilter}
        layoutId="provider-leads-filter"
      />

      <div className="bg-card border border-border rounded-xl p-6">
        {filteredCustomers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            {filter === "new"
              ? "No unread leads right now. New customer activity will appear here."
              : "No customers in this view yet. Completed purchases and inquiries appear here automatically."}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer, idx) => {
              const expanded = expandedEmail === customer.seeker.email;
              const leadCount = customer.leads.length;
              const purchaseCount = customer.purchases.length;
              return (
                <motion.div
                  key={customer.seeker.email}
                  variants={fadeUpItem}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: idx * 0.05 }}
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
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            New
                          </span>
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
                      <CustomerDemographicsChips demographics={customer.demographics} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {leadCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => void toggleLeadActivity(customer)}
                          className="px-4 py-2 border border-border rounded-lg text-sm inline-flex items-center gap-2 hover:bg-accent"
                        >
                          {expanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide leads
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View leads
                            </>
                          )}
                        </button>
                      ) : null}
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

                  {customer.purchases.length > 0 ? (
                    <div className="border-t border-border bg-card/50 px-4 py-4 space-y-3">
                      <h3 className="text-sm font-semibold">Purchased policies</h3>
                      <div className="space-y-2">
                        {customer.purchases.map((purchase) => (
                          <PurchasedPolicyRow
                            key={purchase.id}
                            purchase={purchase}
                            busy={actionPurchaseId === purchase.id}
                            onRevoke={(purchaseId) =>
                              setPendingAction({
                                purchaseId,
                                action: "revoke",
                                policyName: purchase.policy?.name ?? "this policy",
                              })
                            }
                            onTerminate={(purchaseId) =>
                              setPendingAction({
                                purchaseId,
                                action: "terminate",
                                policyName: purchase.policy?.name ?? "this policy",
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {expanded && customer.leads.length > 0 ? (
                    <div className="border-t border-border bg-card/80 px-4 py-4">
                      <h3 className="text-sm font-semibold mb-2">Lead activity</h3>
                      <div className="space-y-2">
                        {customer.leads.map((lead) => (
                          <div
                            key={lead.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-[88px]">
                              <span className="font-medium">{titleCase(lead.type)}</span>
                              {lead.isNew ? (
                                <span className="text-[10px] font-semibold uppercase text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                  New
                                </span>
                              ) : null}
                            </div>
                            <span className="text-muted-foreground flex-1">
                              {lead.summary || lead.policy?.name || "General inquiry"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs w-fit ${statusClass(lead.status)}`}
                            >
                              {titleCase(lead.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ActionConfirmDialog
        open={!!pendingAction}
        title={
          pendingAction?.action === "revoke"
            ? "Revoke purchased policy?"
            : "Terminate purchased policy?"
        }
        description={
          pendingAction
            ? pendingAction.action === "revoke"
              ? `Revoke ${pendingAction.policyName}? It will be removed from the policy seeker's purchases and they will be notified by email and message.`
              : `Terminate ${pendingAction.policyName}? The seeker will be notified that this policy is no longer being served.`
            : ""
        }
        confirmLabel={pendingAction?.action === "revoke" ? "Revoke policy" : "Terminate policy"}
        confirmTone={pendingAction?.action === "revoke" ? "destructive" : "default"}
        loading={!!actionPurchaseId}
        onConfirm={() => void runPurchaseAction()}
        onCancel={() => setPendingAction(null)}
      />
    </AnimatedPage>
  );
}
