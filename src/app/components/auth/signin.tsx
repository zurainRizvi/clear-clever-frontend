import { useState } from "react";
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
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { ClearCleverLogo } from "./clearclever-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import { login, sendOtp } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { useAuthRedirect } from "../auth-context";
import { setPendingEmail } from "@/lib/auth-storage";
import {
  SIGN_IN_ROLES,
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

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const authRedirect = useAuthRedirect();
  const [step, setStep] = useState<"role" | "credentials">("role");
  const [selectedRoleId, setSelectedRoleId] = useState<SignInRoleId | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInForm>();

  const selectedRole = selectedRoleId ? signInRoleById(selectedRoleId) : undefined;

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

      const from = (location.state as { from?: string } | null)?.from;
      authRedirect(result.token, result.user, from ?? selectedRole.route);
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
        <div className="absolute top-6 right-6">
          <DarkModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {step === "role" ? (
            <>
              <ClearCleverLogo className="mb-8" />
              <h1 className="text-3xl font-bold mb-2">{copy.auth.signInTitle}</h1>
              <p className="text-muted-foreground mb-8">Select your role to continue</p>
              <div className="space-y-3">
                {SIGN_IN_ROLES.map((role, index) => {
                  const Icon = ROLE_ICONS[role.id];
                  return (
                    <motion.button
                      key={role.id}
                      type="button"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setStep("credentials");
                      }}
                      className="relative w-full text-left p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      {role.premium ? (
                        <span className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          Admin
                        </span>
                      ) : null}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-0.5">{role.title}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change role
                </button>
              </div>
              <ClearCleverLogo linkToHome={false} className="mb-6" />
              <h1 className="text-3xl font-bold mb-2">{copy.auth.signInTitle}</h1>
              <p className="text-muted-foreground mb-2">{copy.auth.signInSubtitle}</p>
              {selectedRole ? (
                <p className="text-sm text-primary mb-6">Signing in as {selectedRole.title}</p>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {errors.root ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {errors.root.message}
                  </motion.div>
                ) : null}
                <div>
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
                </div>

                <div>
                  <label className="block text-sm mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      {...register("password")}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {errors.password ? (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? "Signing in…" : copy.auth.signInCta}
                  <ArrowRight className="w-5 h-5" />
                </button>
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
