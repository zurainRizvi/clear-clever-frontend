import { useMemo, useState } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { changeUserRole, deactivateUser } from "@/lib/admin-api";
import { titleCase } from "@/lib/admin-utils";
import type { UserRole } from "@/lib/types";
import { useAdmin } from "./admin-context";
import { useAuth } from "../auth-context";

const ASSIGNABLE_ROLES: UserRole[] = ["user", "insurer", "admin", "superadmin"];

interface AdminUsersPageProps {
  mode: "employee" | "superadmin";
}

export function AdminUsersPage({ mode }: AdminUsersPageProps) {
  const { users, loading, refresh, setUsers } = useAdmin();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  const canManageRole = mode === "superadmin";
  const canDeactivate = true;

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setBusyId(userId);
    try {
      const data = await changeUserRole(userId, role);
      setUsers(users.map((user) => (user.id === userId ? data.user : user)));
      toast.success("User role updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update role");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm("Deactivate this user? They will not be able to sign in.")) return;
    setBusyId(userId);
    try {
      const data = await deactivateUser(userId);
      setUsers(users.map((user) => (user.id === userId ? data.user : user)));
      toast.success("User deactivated");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not deactivate user");
    } finally {
      setBusyId(null);
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
        <h1 className="text-3xl font-bold mb-1">User management</h1>
        <p className="text-muted-foreground">
          {mode === "superadmin"
            ? "Full control including role changes and account deactivation"
            : "View users and deactivate accounts (super admin required for privileged roles)"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No users match your search.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const roleOptions =
                mode === "superadmin"
                  ? ASSIGNABLE_ROLES
                  : ASSIGNABLE_ROLES.filter((role) => role !== "superadmin");

              return (
                <div
                  key={user.id}
                  className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-accent/30 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{user.fullName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                      {isSelf ? " · You" : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        user.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {titleCase(user.status)}
                    </span>
                    {canManageRole && !isSelf && user.role !== "superadmin" ? (
                      <select
                        value={user.role}
                        disabled={busyId === user.id}
                        onChange={(e) =>
                          void handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        className="px-3 py-2 border border-border rounded-xl bg-background text-sm"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {titleCase(role)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-3 py-1 bg-muted rounded-full text-sm">
                        {titleCase(user.role)}
                      </span>
                    )}
                    {canDeactivate && !isSelf && user.status === "active" ? (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => void handleDeactivate(user.id)}
                        className="px-4 py-2 border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 text-sm disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
