import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, CreditCard } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { BackToHomeLink } from "./back-to-home";
import { ClearCleverLogo } from "./clearclever-logo";
import { motion } from "motion/react";
import { toast } from "sonner";
import { signup } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { isValidCnicInput, normalizeCnicInput, formatCnicWhileTyping } from "@/lib/cnic";
import { isSignupPasswordValid } from "@/lib/password-strength";
import { PasswordStrengthField } from "./password-strength-field";
import { setPendingEmail } from "@/lib/auth-storage";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(10, "Enter a valid Pakistan phone number"),
    cnic: z
      .string()
      .optional()
      .refine((v) => !v?.trim() || isValidCnicInput(v), {
        message: "CNIC must be 13 digits (e.g. 42101-1234567-1)",
      }),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine(isSignupPasswordValid, {
        message:
          "Use 8+ characters with upper & lower case letters, a number, and no special symbols",
      }),
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
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SignUpForm>();

  useEffect(() => {
    reset({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  }, [reset]);

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
        ...(data.cnic?.trim() ? { cnic: normalizeCnicInput(data.cnic) } : {}),
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
          if (["fullName", "email", "phone", "password", "confirmPassword", "cnic"].includes(field)) {
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            {(["fullName", "email", "phone"] as const).map((field, index) => {
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
                phone: "03001234567",
              };
              return (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
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
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <label className="block text-sm mb-2">
                CNIC <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  {...register("cnic", {
                    onChange: (e) => {
                      setValue("cnic", formatCnicWhileTyping(e.target.value));
                    },
                  })}
                  placeholder="42101-1234567-1"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono tracking-wide"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can add this later, but it is required before filing a claim.
              </p>
              {errors.cnic && (
                <p className="text-sm text-destructive mt-1">{errors.cnic.message}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    onChange: (event) => setPasswordValue(event.target.value),
                  })}
                  placeholder="Create a strong password"
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
              <PasswordStrengthField password={passwordValue} showRequirements className="mt-3" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
            >
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
            </motion.div>

            <motion.button
              type="submit"
              disabled={submitting}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {submitting ? "Creating account…" : copy.auth.signUpCta}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
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
