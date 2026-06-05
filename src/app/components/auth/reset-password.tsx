import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { BackToHomeLink } from "./back-to-home";
import { ClearCleverLogo } from "./clearclever-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  useEffect(() => {
    reset({ password: "", confirmPassword: "" });
  }, [reset]);

  const onSubmit = async (raw: ResetPasswordForm) => {
    if (!token) return;

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ResetPasswordForm | undefined;
        if (field) setError(field, { message: issue.message });
      });
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        token,
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      });
      toast.success(copy.auth.resetPasswordSuccess);
      navigate("/signin", {
        state: { message: copy.auth.resetPasswordSuccess },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        Object.entries(err.fieldErrors).forEach(([field, message]) => {
          const key = field as keyof ResetPasswordForm;
          if (key === "password" || key === "confirmPassword") {
            setError(key, { message });
          }
        });
        toast.error(err.message);
      } else {
        toast.error(copy.errors.network);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex bg-background items-center justify-center p-8 relative">
        <div className="absolute top-6 left-6">
          <BackToHomeLink />
        </div>
        <div className="absolute top-6 right-6">
          <DarkModeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <ClearCleverLogo linkToHome={false} className="mb-6 mx-auto" />
          <h1 className="text-2xl font-bold mb-3">{copy.auth.resetPasswordInvalidTitle}</h1>
          <p className="text-muted-foreground mb-6">{copy.auth.resetPasswordInvalidSubtitle}</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Request a new reset link
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-1 bg-card border-r border-border items-center justify-center p-12">
        <div className="max-w-lg">
          <ClearCleverLogo size="large" className="mb-10" />
          <h2 className="text-3xl font-bold mb-4 font-[Poppins]">Choose a new password</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Use at least 8 characters. After updating, sign in with your new password.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        <div className="absolute top-6 left-6">
          <BackToHomeLink />
        </div>
        <div className="absolute top-6 right-6">
          <DarkModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <ClearCleverLogo linkToHome={false} className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">{copy.auth.resetPasswordTitle}</h1>
          <p className="text-muted-foreground mb-8">{copy.auth.resetPasswordSubtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <label className="block text-sm mb-2">New password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="At least 8 characters"
                  className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <label className="block text-sm mb-2">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              ) : null}
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
              {submitting ? "Updating password…" : copy.auth.resetPasswordCta}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
