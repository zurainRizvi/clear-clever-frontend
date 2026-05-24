import { AdminProvider } from "./admin-context";
import { AdminPortalLayout } from "./admin-portal-layout";
import { MessagesProvider } from "./messages-context";

export function AdminDashboard() {
  return (
    <AdminProvider>
      <MessagesProvider>
        <AdminPortalLayout variant="superadmin" />
      </MessagesProvider>
    </AdminProvider>
  );
}
