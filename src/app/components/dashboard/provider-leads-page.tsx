import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Mail, MessageSquare, Phone, User } from "lucide-react";
import { useProvider } from "./provider-context";
import { statusClass, titleCase } from "@/lib/provider-utils";
import { fetchConversations } from "@/lib/messaging-api";

export function ProviderLeadsPage() {
  const { leads, loading } = useProvider();
  const navigate = useNavigate();
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => lead.status === filter);
  }, [filter, leads]);

  const openConversation = async (seekerId: string | undefined) => {
    if (!seekerId) return;
    setContactingId(seekerId);
    try {
      const data = await fetchConversations();
      const existing = data.conversations.find(
        (conversation) =>
          conversation.type === "user_insurer" &&
          conversation.participants.some((participant) => participant.id === seekerId)
      );
      navigate("/provider-dashboard/messages", {
        state: existing
          ? { focusConversationId: existing.id }
          : undefined,
      });
    } finally {
      setContactingId(null);
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
          Inquiries, favorites, and completed purchases from policy seekers
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "new", "in_progress", "closed"].map((value) => (
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
            {value === "all" ? "All" : titleCase(value)}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {filteredLeads.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No leads in this view yet. Completed purchases and inquiries appear here automatically.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-xl"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{lead.seeker?.fullName ?? "Policy seeker"}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3 mt-1">
                    {lead.seeker?.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.seeker.email}
                      </span>
                    ) : null}
                    {lead.seeker?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.seeker.phone}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {lead.summary || lead.policy?.name || titleCase(lead.type)}
                  </p>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">{titleCase(lead.type)}</div>
                  <div className="font-medium">{lead.policy?.name ?? "—"}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm w-fit ${statusClass(lead.status)}`}>
                  {titleCase(lead.status)}
                </span>
                <button
                  type="button"
                  disabled={!lead.seeker?.id || contactingId === lead.seeker.id}
                  onClick={() => void openConversation(lead.seeker?.id)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  {contactingId === lead.seeker?.id ? "Opening…" : "Message"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
