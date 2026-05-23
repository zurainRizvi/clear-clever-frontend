import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./components/auth-context";
import { SavedPoliciesProvider } from "./components/saved-policies-context";
import { ProtectedRoute } from "./components/protected-route";
import { LandingPage } from "./components/landing-page";
import { SignIn } from "./components/auth/signin";
import { SignUp } from "./components/auth/signup";
import { OTPVerification } from "./components/auth/otp-verification";
import { RoleSelection } from "./components/auth/role-selection";
import { PolicySeekerDashboard } from "./components/dashboard/policy-seeker-dashboard";
import { SeekerDashboardHome } from "./components/dashboard/seeker-dashboard-home";
import { ComparePolicies } from "./components/dashboard/compare-policies";
import { PurchaseFlow } from "./components/dashboard/purchase-flow";
import { SavedPolicies } from "./components/dashboard/saved-policies";
import { DashboardPlaceholder } from "./components/dashboard/dashboard-placeholder";
import { ProviderDashboard } from "./components/dashboard/provider-dashboard";
import { EmployeeDashboard } from "./components/dashboard/employee-dashboard";
import { AdminDashboard } from "./components/dashboard/admin-dashboard";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SavedPoliciesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route
                path="/role-selection"
                element={
                  <ProtectedRoute>
                    <RoleSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PolicySeekerDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SeekerDashboardHome />} />
                <Route path="compare" element={<ComparePolicies />} />
                <Route path="purchase" element={<PurchaseFlow />} />
                <Route path="saved" element={<SavedPolicies />} />
                <Route
                  path="purchases"
                  element={
                    <DashboardPlaceholder
                      title="My purchases"
                      description="Your purchased policies and post-purchase timeline will appear here."
                    />
                  }
                />
                <Route
                  path="claims"
                  element={
                    <DashboardPlaceholder
                      title="Claims"
                      description="Track and manage your insurance claims in one place."
                    />
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <DashboardPlaceholder
                      title="Notifications"
                      description="Payment confirmations, insurer messages, and call schedules will appear here."
                    />
                  }
                />
                <Route
                  path="messages"
                  element={
                    <DashboardPlaceholder
                      title="Messages"
                      description="Conversations with insurers and ClearClever support."
                    />
                  }
                />
                <Route
                  path="support"
                  element={
                    <DashboardPlaceholder
                      title="Support"
                      description="Get help from our insurance advisors."
                      actionLabel="Contact support"
                    />
                  }
                />
                <Route
                  path="settings"
                  element={
                    <DashboardPlaceholder
                      title="Settings"
                      description="Manage your profile, security, and notification preferences."
                    />
                  }
                />
              </Route>
              <Route
                path="/provider-dashboard"
                element={
                  <ProtectedRoute>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee-dashboard"
                element={
                  <ProtectedRoute>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/compare" element={<Navigate to="/dashboard/compare" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SavedPoliciesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
