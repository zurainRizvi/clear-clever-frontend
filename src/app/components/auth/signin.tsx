import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { toast } from "sonner";
import { login, routeForRole } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { useAuthRedirect } from "../auth-context";
import { setPendingEmail } from "@/lib/auth-storage";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof schema>;

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const authRedirect = useAuthRedirect();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInForm>();

  const onSubmit = async (raw: SignInForm) => {
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
      const from = (location.state as { from?: string } | null)?.from;
      authRedirect(result.token, result.user, from ?? routeForRole(result.user.role));
      toast.success("Welcome back");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.message.includes("verify")) {
          setPendingEmail(data.email);
          toast.message(copy.auth.pendingVerification);
          navigate("/otp-verification");
          return;
        }
        const fieldErrors = err.fieldErrors;
        if (fieldErrors.email) setError("email", { message: fieldErrors.email });
        if (fieldErrors.password) setError("password", { message: fieldErrors.password });
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
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-[Poppins]">ClearClever</span>
          </Link>

          <h1 className="text-3xl font-bold mb-2">{copy.auth.signInTitle}</h1>
          <p className="text-muted-foreground mb-8">{copy.auth.signInSubtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : copy.auth.signInCta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

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
