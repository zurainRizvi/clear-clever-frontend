import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { BackToHomeLink } from "./back-to-home";
import { ClearCleverLogo } from "./clearclever-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import { signup } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { setPendingEmail } from "@/lib/auth-storage";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(10, "Enter a valid Pakistan phone number"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpForm = z.infer<typeof schema>;

export function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpForm>();

  const onSubmit = async (raw: SignUpForm) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpForm | undefined;
        if (field) setError(field, { message: issue.message });
      });
      return;
    }
    const data = parsed.data;
    setSubmitting(true);
    try {
      const result = await signup({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      const verifiedEmail = result.email ?? data.email;
      setPendingEmail(verifiedEmail);
      if (result.debugCode) {
        toast.message(`Dev code: ${result.debugCode}`);
      }
      if (result.emailSent === true) {
        toast.success("Verification code sent");
      } else if (!result.debugCode) {
        toast.message("Check your email for the code, or use Resend on the next screen.");
      }
      navigate("/otp-verification", { state: { email: verifiedEmail } });
    } catch (err) {
      if (err instanceof ApiError) {
        Object.entries(err.fieldErrors).forEach(([field, message]) => {
          const key = field as keyof SignUpForm;
          if (["fullName", "email", "phone", "password", "confirmPassword"].includes(field)) {
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

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-1 bg-card border-r border-border items-center justify-center p-12">
        <div className="max-w-lg">
          <ClearCleverLogo size="large" className="mb-10" />
          <h2 className="text-3xl font-bold mb-4 font-[Poppins]">
            Start comparing with confidence
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Create your account to receive personalized policy recommendations from trusted
            insurers across Pakistan.
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
          className="w-full max-w-md my-8"
        >
          <ClearCleverLogo className="mb-8" />

          <h1 className="text-3xl font-bold mb-2">{copy.auth.signUpTitle}</h1>
          <p className="text-muted-foreground mb-8">{copy.auth.signUpSubtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(["fullName", "email", "phone"] as const).map((field) => {
              const icons = { fullName: User, email: Mail, phone: Phone };
              const Icon = icons[field];
              const labels = {
                fullName: "Full name",
                email: "Email address",
                phone: "Phone number",
              };
              const placeholders = {
                fullName: "Your full name",
                email: "you@example.com",
                phone: "+92 300 1234567",
              };
              return (
                <div key={field}>
                  <label className="block text-sm mb-2">{labels[field]}</label>
                  <div className="relative">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      {...register(field)}
                      placeholder={placeholders[field]}
                      className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  {errors[field] && (
                    <p className="text-sm text-destructive mt-1">{errors[field]?.message}</p>
                  )}
                </div>
              );
            })}

            <div>
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="At least 8 characters"
                  className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {submitting ? "Creating account…" : copy.auth.signUpCta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
