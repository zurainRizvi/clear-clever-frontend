import { AdminProvider } from "./admin-context";
import { AdminPortalLayout } from "./admin-portal-layout";

export function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminPortalLayout variant="superadmin" />
    </AdminProvider>
  );
}
