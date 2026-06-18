import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseFlow } from "./purchase-flow";
import { useAuth } from "../auth-context";
import {
  fetchCategoryQuestions,
  fetchPublicPolicy,
  fetchRecommendations,
  updateMeProfile,
} from "@/lib/auth-api";
import { fetchStoredQuestionnaireAnswers } from "@/lib/purchase-api";
import type { AuthUser, PublicPolicy } from "@/lib/types";

vi.mock("../auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/auth-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-api")>("@/lib/auth-api");
  return {
    ...actual,
    fetchCategoryQuestions: vi.fn(),
    fetchPublicPolicy: vi.fn(),
    fetchRecommendations: vi.fn(),
    updateMeProfile: vi.fn(),
  };
});

vi.mock("@/lib/purchase-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/purchase-api")>("@/lib/purchase-api");
  return {
    ...actual,
    fetchStoredQuestionnaireAnswers: vi.fn(),
    createPurchase: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const seeker: AuthUser = {
  id: "user-1",
  fullName: "Ayesha Khan",
  email: "seeker@clearclever.com",
  phone: "+923021234567",
  cnicMasked: "42101-*******-2",
  hasCnic: true,
  kycStatus: "verified",
  role: "user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const policy: PublicPolicy = {
  id: "policy-1",
  slug: "home-plus",
  name: "Home Plus Secure",
  category: "home",
  description: "Home protection with structured feature sections.",
  premiumMonthlyPkr: 3500,
  premiumYearlyPkr: 39900,
  coverageSummary: "Up to PKR 5,000,000 building cover.",
  features: [],
  featureSections: [
    {
      id: "coverage",
      title: "Coverage details",
      rows: [{ key: "theft", label: "Theft add-on", included: true }],
    },
  ],
  deductiblePkr: 0,
  status: "approved",
  insurer: {
    id: "insurer-1",
    slug: "tpl-insurance",
    companyName: "TPL Insurance",
  },
};

function renderPurchaseFlow() {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/dashboard/purchase",
          state: {
            policy,
            category: "home",
            answers: {},
            returnTo: "/dashboard/compare",
          },
        },
      ]}
    >
      <Routes>
        <Route path="/dashboard/purchase" element={<PurchaseFlow />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PurchaseFlow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: seeker,
      userRole: "user",
      userName: seeker.fullName,
      userEmail: seeker.email,
      setSession: vi.fn(),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
    });
    vi.mocked(fetchPublicPolicy).mockResolvedValue({ policy });
    vi.mocked(fetchCategoryQuestions).mockResolvedValue({
      category: "home",
      name: "Home",
      available: true,
      questions: [],
    });
    vi.mocked(fetchStoredQuestionnaireAnswers).mockResolvedValue({
      category: "home",
      available: true,
      response: { answers: {}, completedQuestionIds: [], updatedAt: "2026-01-01T00:00:00.000Z" },
    });
    vi.mocked(fetchRecommendations).mockResolvedValue({
      category: "home",
      available: true,
      recommendations: [],
    });
    vi.mocked(updateMeProfile).mockResolvedValue({ user: seeker });
  });

  it("moves from contact details to review when a policy has structured feature sections", async () => {
    const user = userEvent.setup();
    renderPurchaseFlow();

    await screen.findByText("Schedule your call");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByText("Contact & policyholder details");
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    await user.type(inputs[4], "Killeen, Texas");
    await user.type(inputs[5], "501 N. 4th Street");
    await user.type(inputs[6], "76541");

    await user.click(screen.getByRole("button", { name: "Review & continue" }));

    await waitFor(() => {
      expect(screen.getByText("Review before insurer checkout")).toBeInTheDocument();
    });
    expect(screen.getByText("Coverage details")).toBeInTheDocument();
  });
});
