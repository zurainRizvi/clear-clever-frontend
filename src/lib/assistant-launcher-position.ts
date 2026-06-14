const STORAGE_KEY = "clearclever:assistant-launcher-offset";
const VIEWPORT_PADDING_PX = 12;

export type LauncherOffset = { x: number; y: number };

export function loadLauncherOffset(): LauncherOffset {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as LauncherOffset;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return { x: 0, y: 0 };
}

export function saveLauncherOffset(offset: LauncherOffset) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
}

/** Keep a fixed bottom-right launcher fully inside the viewport. */
export function clampLauncherOffset(
  offset: LauncherOffset,
  element: HTMLElement | null,
): LauncherOffset {
  if (!element || typeof window === "undefined") return offset;

  let { x, y } = offset;
  const pad = VIEWPORT_PADDING_PX;
  const rect = element.getBoundingClientRect();

  if (rect.left < pad) x += pad - rect.left;
  if (rect.top < pad) y += pad - rect.top;
  if (rect.right > window.innerWidth - pad) {
    x -= rect.right - (window.innerWidth - pad);
  }
  if (rect.bottom > window.innerHeight - pad) {
    y -= rect.bottom - (window.innerHeight - pad);
  }

  return { x, y };
}
