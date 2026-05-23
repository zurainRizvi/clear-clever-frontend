import type { AuthUser } from "./types";

export type SignInRoleId = "policy-seeker" | "insurance-provider" | "employee" | "super-admin";

export const SIGN_IN_ROLES: {
  id: SignInRoleId;
  title: string;
  description: string;
  expectedApiRole: AuthUser["role"];
  route: string;
  premium?: boolean;
}[] = [
  {
    id: "policy-seeker",
    title: "Policy Seeker",
    description: "Compare policies and manage your coverage",
    expectedApiRole: "user",
    route: "/dashboard",
  },
  {
    id: "insurance-provider",
    title: "Insurance Provider",
    description: "Manage policies, leads, and customer relationships",
    expectedApiRole: "insurer",
    route: "/provider-dashboard",
  },
  {
    id: "employee",
    title: "Employee",
    description: "Platform operations and insurer approvals",
    expectedApiRole: "admin",
    route: "/employee-dashboard",
  },
  {
    id: "super-admin",
    title: "Super Admin",
    description: "Full platform administration",
    expectedApiRole: "superadmin",
    route: "/admin-dashboard",
    premium: true,
  },
];

export function signInRoleById(id: SignInRoleId) {
  return SIGN_IN_ROLES.find((r) => r.id === id);
}
