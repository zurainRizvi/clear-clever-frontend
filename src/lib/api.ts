import { getToken } from "./auth-storage";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors.length > 0 ? errors : [message];
    this.fieldErrors = parseFieldErrors(this.errors);
  }
}

export function parseFieldErrors(errors: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const err of errors) {
    const idx = err.indexOf(":");
    if (idx > 0) {
      const field = err.slice(0, idx).trim();
      const msg = err.slice(idx + 1).trim();
      if (field && msg) map[field] = msg;
    }
  }
  return map;
}

interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

interface ApiErrorBody {
  success: false;
  message: string;
  errors: string[];
}

const REQUEST_TIMEOUT_MS = 30_000;

export function getApiBaseUrl(): string {
  if (!API_BASE) {
    console.warn("[ClearClever] VITE_API_URL is not set");
  }
  return API_BASE;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError(
      0,
      "API URL is not configured. Set VITE_API_URL in Vercel to your Render backend URL."
    );
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has("Content-Type") && rest.body) {
    reqHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...rest, headers: reqHeaders, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "Request timed out. The server may be waking up — try again in a moment.");
    }
    throw new ApiError(0, "Network error — check your connection and API URL.");
  } finally {
    clearTimeout(timeoutId);
  }

  let body: ApiSuccessBody<T> | ApiErrorBody | null = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody;
  }

  if (!response.ok || !body || body.success === false) {
    const message =
      body && "message" in body ? body.message : `Request failed (${response.status})`;
    const errors = body && "errors" in body && Array.isArray(body.errors) ? body.errors : [];
    throw new ApiError(response.status, message, errors);
  }

  return (body.data !== undefined ? body.data : body) as T;
}
