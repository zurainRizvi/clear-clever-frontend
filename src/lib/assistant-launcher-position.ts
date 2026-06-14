const STORAGE_KEY = "clearclever:assistant-launcher-offset";
const VIEWPORT_PADDING_PX = 16;
const ANCHOR_RIGHT_PX = 24;
const ANCHOR_BOTTOM_PX = 24;

export type LauncherOffset = { x: number; y: number };

export function loadLauncherOffset(): LauncherOffset {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as LauncherOffset;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return clampLauncherOffset(parsed, null);
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

function offsetBounds(element: HTMLElement | null): { minX: number; maxX: number; minY: number; maxY: number } {
  if (typeof window === "undefined") {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const pad = VIEWPORT_PADDING_PX;
  const elWidth = element?.offsetWidth ?? 168;
  const elHeight = element?.offsetHeight ?? 48;
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Fixed bottom-right anchor with transform-origin bottom right.
  const minX = pad - (W - ANCHOR_RIGHT_PX - elWidth);
  const maxX = W - pad - ANCHOR_RIGHT_PX;
  const minY = pad - (H - ANCHOR_BOTTOM_PX - elHeight);
  const maxY = H - pad - ANCHOR_BOTTOM_PX;

  return { minX, maxX, minY, maxY };
}

/** Keep a fixed bottom-right launcher fully inside the viewport. */
export function clampLauncherOffset(
  offset: LauncherOffset,
  element: HTMLElement | null,
): LauncherOffset {
  if (typeof window === "undefined") return offset;

  const { minX, maxX, minY, maxY } = offsetBounds(element);
  let x = Math.min(maxX, Math.max(minX, offset.x));
  let y = Math.min(maxY, Math.max(minY, offset.y));

  if (element) {
    element.style.transform = `translate(${x}px, ${y}px)`;
    const rect = element.getBoundingClientRect();
    const pad = VIEWPORT_PADDING_PX;

    if (rect.left < pad) x += pad - rect.left;
    if (rect.top < pad) y += pad - rect.top;
    if (rect.right > window.innerWidth - pad) {
      x -= rect.right - (window.innerWidth - pad);
    }
    if (rect.bottom > window.innerHeight - pad) {
      y -= rect.bottom - (window.innerHeight - pad);
    }

    x = Math.min(maxX, Math.max(minX, x));
    y = Math.min(maxY, Math.max(minY, y));
  }

  return { x, y };
}
