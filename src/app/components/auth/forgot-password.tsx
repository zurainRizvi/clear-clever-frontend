import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { ClearCleverLogo } from "./clearclever-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  useEffect(() => {
    reset({ email: "" });
  }, [reset]);

  const onSubmit = async (raw: ForgotPasswordForm) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") {
          setError("email", { message: issue.message });
        }
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await forgotPassword({ email: parsed.data.email });
      setSubmitted(true);
      if (result.resetUrl) {
        toast.message(`Dev reset link copied to toast`, {
          description: result.resetUrl,
        });
      } else if (result.emailSent === true) {
        toast.success("Reset link sent");
      } else {
        toast.message(copy.auth.forgotPasswordSuccess);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.email) {
          setError("email", { message: err.fieldErrors.email });
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
      <div className="hidden lg:flex flex-1 bg-card border-r border-border items-center justify-center p-12">
        <div className="max-w-lg">
          <ClearCleverLogo size="large" className="mb-10" />
          <h2 className="text-3xl font-bold mb-4 font-[Poppins]">Account recovery</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We&apos;ll send a secure link to reset your password. Links expire in 10 minutes for
            your protection.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        <Link
          to="/signin"
          className="absolute top-6 left-6 text-sm text-primary hover:underline inline-flex items-center gap-1 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
        <div className="absolute top-6 right-6">
          <DarkModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md pt-10"
        >
          <ClearCleverLogo className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">{copy.auth.forgotPasswordTitle}</h1>
          <p className="text-muted-foreground mb-8">{copy.auth.forgotPasswordSubtitle}</p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <p className="text-sm leading-relaxed">{copy.auth.forgotPasswordSuccess}</p>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                Return to sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
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

              <motion.button
                type="submit"
                disabled={submitting}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? "Sending link…" : copy.auth.forgotPasswordCta}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
