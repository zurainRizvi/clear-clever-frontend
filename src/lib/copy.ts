/** Centralized product microcopy — keep insurance UX calm and trustworthy. */

export const copy = {
  auth: {
    signInTitle: "Welcome back",
    signInSubtitle: "Sign in to review your coverage and comparisons",
    signUpTitle: "Create your account",
    signUpSubtitle: "Join ClearClever to compare trusted policies in Pakistan",
    otpTitle: "Verify your email",
    otpSubtitle: (email: string) =>
      `We sent a secure 6-digit code to ${email}. Enter it below to continue.`,
    otpResend: "Resend verification code",
    otpResendWait: (seconds: number) => `Resend code in ${seconds}s`,
    verifyCta: "Verify and continue",
    signInCta: "Sign in securely",
    signUpCta: "Create account",
    forgotPasswordLink: "Forgot password?",
    forgotPasswordTitle: "Reset your password",
    forgotPasswordSubtitle: "Enter the email linked to your ClearClever account",
    forgotPasswordCta: "Send reset link",
    forgotPasswordSuccess:
      "If an account exists for that email, we sent a password reset link. Check your inbox.",
    resetPasswordTitle: "Set a new password",
    resetPasswordSubtitle: "Choose a strong password for your ClearClever account",
    resetPasswordCta: "Update password",
    resetPasswordSuccess: "Password updated. Sign in with your new password.",
    resetPasswordInvalidTitle: "Invalid reset link",
    resetPasswordInvalidSubtitle:
      "This password reset link is missing or expired. Request a new one to continue.",
    pendingVerification:
      "Please verify your email before signing in. We can send you a new code.",
    roleTitle: "How will you use ClearClever?",
    roleSubtitle: "Choose the experience that matches your needs",
  },
  errors: {
    generic: "Something went wrong. Please try again in a moment.",
    network: "We couldn't reach ClearClever. Check your connection and try again.",
    unauthorized: "Please sign in to continue.",
    validation: "We couldn't verify your information. Please review the fields below.",
  },
  compare: {
    title: "Compare insurance policies",
    subtitle: "Select a coverage type to begin your personalized comparison",
    othersTitle: "More coverage types coming soon",
    othersBody:
      "We're expanding ClearClever with additional categories. Home, auto, life, and pet insurance are available today.",
    questionnaireCta: "Continue to coverage review",
    resultsTitle: "Your comparison is ready",
    resultsSubtitle: (count: number) =>
      count === 0
        ? "No matching policies yet for your answers. Try adjusting your responses."
        : `We found ${count} ${count === 1 ? "policy" : "policies"} aligned with your profile.`,
    emptyRecommendations: "No policies matched your answers yet",
    compareLimit: "You can compare up to four policies at a time.",
    badge: {
      aiRecommended: "AI-assisted pick",
      bestValue: "Best Value",
      mostPopular: "Most Popular",
      lowestPremium: "Lowest Premium",
      bestCoverage: "Best Coverage",
    },
  },
  saved: {
    emptyTitle: "No saved policies yet",
    emptyBody:
      "Save policies you're considering so you can compare coverage and premiums when you're ready.",
    browseCta: "Explore policies",
    removed: "Removed from your saved list",
    saved: "Added to your saved policies",
  },
  purchase: {
    cta: "Continue to coverage review",
    purchaseCta: "Review purchase details",
  },
} as const;
