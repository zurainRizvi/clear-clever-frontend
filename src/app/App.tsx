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
import { MyPurchases } from "./components/dashboard/my-purchases";
import { NotificationsPage } from "./components/dashboard/notifications-page";
import { ClaimsPage } from "./components/dashboard/claims-page";
import { MessagesPage } from "./components/dashboard/messages-panel";
import { ProviderDashboard } from "./components/dashboard/provider-dashboard";
import { ProviderDashboardHome } from "./components/dashboard/provider-dashboard-home";
import { ProviderPoliciesPage } from "./components/dashboard/provider-policies-page";
import { ProviderLeadsPage } from "./components/dashboard/provider-leads-page";
import { ProviderClaimsPage } from "./components/dashboard/provider-claims-page";
import { ProviderAnalyticsPage } from "./components/dashboard/provider-analytics-page";
import { ProviderSettingsPage } from "./components/dashboard/provider-settings-page";
import { ProviderMessagesPage } from "./components/dashboard/messages-panel";
import { EmployeeDashboard } from "./components/dashboard/employee-dashboard";
import { EmployeeDashboardHome } from "./components/dashboard/employee-dashboard-home";
import { AdminApprovalsPage } from "./components/dashboard/admin-approvals-page";
import { AdminUsersPage } from "./components/dashboard/admin-users-page";
import { EmployeeProvidersPage } from "./components/dashboard/employee-providers-page";
import { AdminReportsPage } from "./components/dashboard/admin-reports-page";
import { AdminActivityPage } from "./components/dashboard/admin-activity-page";
import { AdminSettingsPage } from "./components/dashboard/admin-settings-page";
import { AdminDashboard } from "./components/dashboard/admin-dashboard";
import { SuperadminDashboardHome } from "./components/dashboard/superadmin-dashboard-home";
import { SuperadminProviderApprovalsPage } from "./components/dashboard/superadmin-provider-approvals-page";
import { SuperadminReportsPage } from "./components/dashboard/superadmin-reports-page";
import { AdminMessagesPage } from "./components/dashboard/admin-messages-page";
import { AdminFraudPage } from "./components/dashboard/admin-fraud-page";
import { AdminAuditPage } from "./components/dashboard/admin-audit-page";
import { AdminHealthPage } from "./components/dashboard/admin-health-page";
import { Toaster } from "./components/ui/sonner";
import { SupportPage } from "./components/dashboard/support-page";
import { ProviderSupportPage } from "./components/dashboard/provider-support-page";
import { SeekerSettingsPage } from "./components/dashboard/seeker-settings-page";
import { StaticPage } from "./components/static-page";

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
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
                  <ProtectedRoute allowedRoles={["user"]}>
                    <RoleSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["user"]}>
                    <PolicySeekerDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SeekerDashboardHome />} />
                <Route path="compare" element={<ComparePolicies />} />
                <Route path="purchase" element={<PurchaseFlow />} />
                <Route path="saved" element={<SavedPolicies />} />
                <Route path="purchases" element={<MyPurchases />} />
                <Route path="claims" element={<ClaimsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route
                  path="messages"
                  element={<MessagesPage />}
                />
                <Route path="support" element={<SupportPage />} />
                <Route path="settings" element={<SeekerSettingsPage />} />
              </Route>
              <Route
                path="/provider-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["insurer"]}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProviderDashboardHome />} />
                <Route path="policies" element={<ProviderPoliciesPage />} />
                <Route path="leads" element={<ProviderLeadsPage />} />
                <Route path="claims" element={<ProviderClaimsPage />} />
                <Route path="analytics" element={<ProviderAnalyticsPage />} />
                <Route path="messages" element={<ProviderMessagesPage />} />
                <Route path="support" element={<ProviderSupportPage />} />
                <Route path="settings" element={<ProviderSettingsPage />} />
              </Route>
              <Route
                path="/employee-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboardHome />} />
                <Route path="approvals" element={<AdminApprovalsPage />} />
                <Route path="users" element={<AdminUsersPage mode="employee" />} />
                <Route path="providers" element={<EmployeeProvidersPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="activity" element={<AdminActivityPage />} />
                <Route path="settings" element={<AdminSettingsPage variant="employee" />} />
              </Route>
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["superadmin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SuperadminDashboardHome />} />
                <Route
                  path="users"
                  element={<AdminUsersPage mode="superadmin" />}
                />
                <Route path="approvals" element={<SuperadminProviderApprovalsPage />} />
                <Route path="policies" element={<AdminApprovalsPage heading="Policy review" />} />
                <Route path="fraud" element={<AdminFraudPage />} />
                <Route path="analytics" element={<SuperadminReportsPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="health" element={<AdminHealthPage />} />
                <Route path="settings" element={<AdminSettingsPage variant="superadmin" />} />
              </Route>
              <Route path="/compare" element={<Navigate to="/dashboard/compare" replace />} />
              <Route path="/about" element={<StaticPage title="About ClearClever" body="ClearClever helps families and businesses compare insurance options with transparent guidance and clear product information." />} />
              <Route path="/partners" element={<StaticPage title="Partnerships" body="ClearClever works with trusted insurer partners to present policy options in one place with consistent customer experience." />} />
              <Route path="/help-center" element={<StaticPage title="Help Center" body="Need help choosing, purchasing, renewing, or claiming? Our support team is available from your portal messages and support section." />} />
              <Route path="/privacy" element={<StaticPage title="Privacy Policy" body="We protect your personal data and only use it to deliver recommendations, policy workflows, and service notifications." />} />
              <Route path="/terms" element={<StaticPage title="Terms of Service" body="By using ClearClever, you agree to our usage terms, platform conduct guidelines, and insurer checkout redirection process." />} />
              <Route path="/cookies" element={<StaticPage title="Cookie Policy" body="ClearClever uses cookies and similar technologies for secure sessions, analytics, and product performance improvements." />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SavedPoliciesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
