import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markInsurerLeadSeen } from "@/lib/insurer-api";
import type { InsurerLeadSummary } from "@/lib/insurer-api";
import { ProviderLeadsPage } from "./provider-leads-page";
import { useProvider } from "./provider-context";

vi.mock("./provider-context", () => ({
  useProvider: vi.fn(),
}));

vi.mock("@/lib/insurer-api", () => ({
  markInsurerLeadSeen: vi.fn(),
}));

vi.mock("@/lib/messaging-api", () => ({
  createConversation: vi.fn(),
  fetchConversations: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const leads: InsurerLeadSummary[] = [
  {
    id: "lead-1",
    type: "inquiry",
    status: "new",
    isNew: true,
    summary: "Interested in home cover",
    createdAt: "2026-05-01T00:00:00.000Z",
    seeker: {
      id: "seeker-1",
      fullName: "Aisha Khan",
      email: "aisha@example.com",
      phone: "+923001112233",
    },
    policy: {
      id: "policy-1",
      slug: "home-cover",
      name: "Home Cover",
      category: "home",
    },
  },
  {
    id: "lead-2",
    type: "favorite",
    status: "new",
    isNew: true,
    summary: "Saved auto policy",
    createdAt: "2026-05-02T00:00:00.000Z",
    seeker: {
      id: "seeker-2",
      fullName: "Bilal Ahmed",
      email: "bilal@example.com",
      phone: "+923004445566",
    },
    policy: {
      id: "policy-2",
      slug: "auto-cover",
      name: "Auto Cover",
      category: "auto",
    },
  },
];

function renderPage() {
  vi.mocked(useProvider).mockReturnValue({
    profile: {
      id: "provider-1",
      companyName: "Provider Co",
      slug: "provider-co",
      contactEmail: "provider@example.com",
      contactPhone: "+923009990000",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    policies: [],
    leads,
    claims: [],
    pendingClaimsCount: 0,
    unseenNewLeadsCount: leads.length,
    policyRows: [],
    loading: false,
    refresh: vi.fn(),
    setProfile: vi.fn(),
    setPolicies: vi.fn(),
  } as ReturnType<typeof useProvider>);

  render(
    <MemoryRouter>
      <ProviderLeadsPage />
    </MemoryRouter>
  );
}

describe("ProviderLeadsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not mark all new leads seen when the New filter is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "New" }));

    expect(screen.getByText("Aisha Khan")).toBeInTheDocument();
    expect(screen.getByText("Bilal Ahmed")).toBeInTheDocument();
    expect(markInsurerLeadSeen).not.toHaveBeenCalled();
  });
});
