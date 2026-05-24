import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Shield, ArrowRight, Mail } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { toast } from "sonner";
import { sendOtp, verifyOtp } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { clearPendingEmail, getPendingEmail, setPendingEmail } from "@/lib/auth-storage";
import { useAuthRedirect } from "../auth-context";

function resolveOtpEmail(locationState: unknown): string {
  const stateEmail = (locationState as { email?: string } | null)?.email?.trim() ?? "";
  return getPendingEmail()?.trim() || stateEmail;
}

export function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const authRedirect = useAuthRedirect();
  const [email, setEmail] = useState(() => resolveOtpEmail(location.state));
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const resolved = resolveOtpEmail(location.state);
    if (resolved) {
      setEmail(resolved);
      setPendingEmail(resolved);
      return;
    }
    navigate("/signup", { replace: true });
  }, [location.state, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      const result = await sendOtp({ email, purpose: "signup" });
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      if (result.debugCode) toast.message(`Dev code: ${result.debugCode}`);
      if (result.emailSent === false && !result.debugCode) {
        toast.error(
          "Email could not be sent from the server. Ask the admin to fix Gmail SMTP on Render, then tap Resend again."
        );
      } else {
        toast.success("A new verification code was sent");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.network);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6 || !email) return;

    setSubmitting(true);
    try {
      const result = await verifyOtp({ email, purpose: "signup", code });
      clearPendingEmail();
      toast.success("Email verified");
      authRedirect(result.token, result.user, "/role-selection");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-[Poppins]">ClearClever</span>
          </Link>

          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{copy.auth.otpTitle}</h1>
            <p className="text-muted-foreground text-sm">{copy.auth.otpSubtitle(email)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 text-center text-xl font-semibold bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="text-center text-sm">
              {timer > 0 ? (
                <p className="text-muted-foreground">{copy.auth.otpResendWait(timer)}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary hover:underline font-medium"
                >
                  {copy.auth.otpResend}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={otp.some((d) => !d) || submitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? "Verifying…" : copy.auth.verifyCta}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Go back
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
