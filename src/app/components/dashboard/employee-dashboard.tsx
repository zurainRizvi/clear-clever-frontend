import { AdminProvider } from "./admin-context";
import { AdminPortalLayout } from "./admin-portal-layout";
import { MessagesProvider } from "./messages-context";

export function EmployeeDashboard() {
  return (
    <AdminProvider>
      <MessagesProvider>
        <AdminPortalLayout variant="employee" />
      </MessagesProvider>
    </AdminProvider>
  );
}
