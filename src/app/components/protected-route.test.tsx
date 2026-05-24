import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./protected-route";
import { useAuth } from "./auth-context";
import type { AuthUser } from "@/lib/types";

vi.mock("./auth-context", () => ({
  useAuth: vi.fn(),
}));

const baseUser: AuthUser = {
  id: "user-1",
  fullName: "Test User",
  email: "test@clearclever.com",
  phone: "+923001234567",
  role: "user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function mockAuth(user: AuthUser | null) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: !!user,
    isLoading: false,
    user,
    userRole: user?.role ?? null,
    userName: user?.fullName ?? null,
    userEmail: user?.email ?? null,
    setSession: vi.fn(),
    refreshUser: vi.fn(),
    logout: vi.fn(),
  });
}

function renderRoute(path: string, user: AuthUser | null, allowedRoles: AuthUser["role"][]) {
  mockAuth(user);

  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/signin" element={<div>Sign in</div>} />
        <Route path="/dashboard" element={<div>Seeker dashboard</div>} />
        <Route
          path={path}
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to sign in", () => {
    renderRoute("/dashboard/compare", null, ["user"]);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders for authenticated users with an allowed role", () => {
    renderRoute("/dashboard/compare", baseUser, ["user"]);

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects authenticated users away from disallowed role routes", () => {
    renderRoute("/admin-dashboard", baseUser, ["superadmin"]);

    expect(screen.getByText("Seeker dashboard")).toBeInTheDocument();
  });
});
