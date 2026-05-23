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
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <PolicySeekerDashboard />
                  </ProtectedRoute>
                }
              />
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
