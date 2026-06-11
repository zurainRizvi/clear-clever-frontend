import { ApiError } from "@/lib/api";

/** User-friendly message for Gemini capacity / quota errors (claims, KYC, assistant). */
export function friendlyAiBusyMessage(err: unknown, fallback = "Could not complete AI request"): string {
  if (!(err instanceof ApiError)) return fallback;

  const detail = err.errors[0] ?? err.message;
  if (/parse|invalid json|incomplete/i.test(detail)) {
    return "AI analysis returned an incomplete result — please wait a moment and try again.";
  }
  if (
    /high demand|busy|503|rate-limited|capacity|quota|daily ai|try again later|try again in/i.test(
      detail
    )
  ) {
    return "AI is experiencing high demand — please wait a moment and try again.";
  }
  return detail;
}
