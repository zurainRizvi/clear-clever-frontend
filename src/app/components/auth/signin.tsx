import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Users,
  Crown,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { BackToHomeLink } from "./back-to-home";
import { ClearCleverLogo } from "./clearclever-logo";
import { PasswordStrengthField } from "./password-strength-field";
import { motion } from "motion/react";
import { toast } from "sonner";
import { login, sendOtp } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { useAuthRedirect } from "../auth-context";
import { setPendingEmail } from "@/lib/auth-storage";
import {
  signInRoleById,
  type SignInRoleId,
} from "@/lib/role-routes";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof schema>;

const ROLE_ICONS = {
  "policy-seeker": User,
  "insurance-provider": Building2,
  employee: Users,
  "super-admin": Crown,
} as const;

const CONSUMER_ROLE_IDS: SignInRoleId[] = ["policy-seeker", "insurance-provider"];
const ADMIN_ROLE_IDS: SignInRoleId[] = ["employee", "super-admin"];

function ProfileRoleCard({
  roleId,
  onSelect,
}: {
  roleId: SignInRoleId;
  onSelect: (id: SignInRoleId) => void;
}) {
  const role = signInRoleById(roleId);
  if (!role) return null;
  const Icon = ROLE_ICONS[roleId];

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(roleId)}
      className="relative flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group min-w-0 flex-1"
    >
      {role.premium ? (
        <span className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
          Admin
        </span>
      ) : null}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-semibold text-base mb-1">{role.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
    </motion.button>
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const authRedirect = useAuthRedirect();
  const [portalMode, setPortalMode] = useState<"consumer" | "admin">("consumer");
  const [step, setStep] = useState<"role" | "credentials">("role");
  const [selectedRoleId, setSelectedRoleId] = useState<SignInRoleId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<SignInForm>();

  const selectedRole = selectedRoleId ? signInRoleById(selectedRoleId) : undefined;
  const visibleRoleIds = portalMode === "admin" ? ADMIN_ROLE_IDS : CONSUMER_ROLE_IDS;

  useEffect(() => {
    reset({ email: "", password: "" });
    setPasswordValue("");
  }, [reset]);

  useEffect(() => {
    const message = (location.state as { message?: string } | null)?.message;
    if (message) {
      toast.success(message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (step === "credentials") {
      reset({ email: "", password: "" });
      setPasswordValue("");
    }
  }, [step, reset]);

  const onSubmit = async (raw: SignInForm) => {
    if (!selectedRole) return;

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          setError(field, { message: issue.message });
        }
      });
      return;
    }
    const data = parsed.data;
    setSubmitting(true);
    try {
      const result = await login(data);

      if (result.user.role !== selectedRole.expectedApiRole) {
        toast.error(
          `This account is registered as ${result.user.role}. Please select the matching role.`
        );
        return;
      }

      authRedirect(result.token, result.user, selectedRole.route);
      toast.success("Welcome back");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.message.includes("verify")) {
          setPendingEmail(data.email);
          toast.message(copy.auth.pendingVerification);
          navigate("/otp-verification", { state: { email: data.email } });
          void sendOtp({ email: data.email, purpose: "signup" })
            .then((otpResult) => {
              if (otpResult.debugCode) {
                toast.message(`Dev code: ${otpResult.debugCode}`);
              } else if (otpResult.emailSent === true) {
                toast.success("Verification code sent to your email");
              }
            })
            .catch(() => {
              /* OTP screen has Resend */
            });
          return;
        }
        if (err.fieldErrors.email) setError("email", { message: err.fieldErrors.email });
        if (err.fieldErrors.password) setError("password", { message: err.fieldErrors.password });
        if (err.status === 401) {
          setError("root", { type: "server", message: err.message });
        }
        toast.error(err.message);
      } else {
        toast.error(copy.errors.network);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {step === "role" ? (
          <div className="absolute top-6 left-6">
            <BackToHomeLink />
          </div>
        ) : null}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPortalMode((mode) => (mode === "admin" ? "consumer" : "admin"));
              setStep("role");
              setSelectedRoleId(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              portalMode === "admin"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
          <DarkModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          {step === "role" ? (
            <>
              <ClearCleverLogo className="mb-8" />
              <h1 className="text-3xl font-bold mb-2">{copy.auth.signInTitle}</h1>
              <p className="text-muted-foreground mb-8">
                {portalMode === "admin"
                  ? "Choose your admin profile to continue"
                  : "Choose how you use ClearClever — side by side, just like picking a profile"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {visibleRoleIds.map((roleId) => (
                  <ProfileRoleCard
                    key={roleId}
                    roleId={roleId}
                    onSelect={(id) => {
                      setSelectedRoleId(id);
                      setStep("credentials");
                    }}
                  />
                ))}
              </div>
              {portalMode === "consumer" ? (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Platform staff? Use the <strong className="text-foreground">Admin</strong> button
                  above for Admin or Super Admin access.
                </p>
              ) : (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Returning as a seeker or insurer? Switch back with the Admin button above.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep("role");
                    setSelectedRoleId(null);
                  }}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Choose a different profile
                </button>
              </div>
              <ClearCleverLogo linkToHome={false} className="mb-6" />
              <h1 className="text-3xl font-bold mb-2">{copy.auth.signInTitle}</h1>
              <p className="text-muted-foreground mb-2">{copy.auth.signInSubtitle}</p>
              {selectedRole ? (
                <p className="text-sm text-primary mb-6">Signing in as {selectedRole.title}</p>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
                {errors.root ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {errors.root.message}
                  </motion.div>
                ) : null}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <label className="block text-sm mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  ) : null}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                >
                  <label className="block text-sm mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        onChange: (event) => setPasswordValue(event.target.value),
                      })}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  ) : null}
                  <PasswordStrengthField password={passwordValue} className="mt-3" />
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {copy.auth.forgotPasswordLink}
                    </Link>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? "Signing in…" : copy.auth.signInCta}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-card border-l border-border items-center justify-center p-12">
        <div className="max-w-lg">
          <ClearCleverLogo size="large" className="mb-10" />
          <h2 className="text-3xl font-bold mb-4 font-[Poppins]">
            Trusted insurance decisions, made clear
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Compare policies from leading Pakistani insurers with transparent recommendations
            built for your coverage needs.
          </p>
        </div>
      </div>
    </div>
  );
}
