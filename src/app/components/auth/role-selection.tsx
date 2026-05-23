import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, User, Building2, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { toast } from "sonner";
import { setRole, routeForRole } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { useAuth } from "../auth-context";

const roles = [
  {
    id: "user" as const,
    title: "Policy seeker",
    description: "Compare policies and manage coverage for yourself or your family",
    icon: User,
  },
  {
    id: "insurer" as const,
    title: "Insurance provider",
    description: "List policies, manage leads, and connect with customers",
    icon: Building2,
  },
];

export function RoleSelection() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"user" | "insurer" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const result = await setRole(selectedRole);
      await refreshUser();
      toast.success("Your profile is ready");
      navigate(routeForRole(result.user.role));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  if (user && user.role !== "user") {
    navigate(routeForRole(user.role), { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-[Poppins]">ClearClever</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{copy.auth.roleTitle}</h1>
          <p className="text-muted-foreground">{copy.auth.roleSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const selected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selectedRole || submitting}
          onClick={handleContinue}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? "Setting up…" : "Continue securely"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
