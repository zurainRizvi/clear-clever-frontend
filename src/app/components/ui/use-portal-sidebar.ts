import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

const NARROW_BREAKPOINT = 1024;

export function useIsNarrowViewport() {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < NARROW_BREAKPOINT : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    const onChange = () => setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}

export function usePortalSidebar(sidebarWidth = 280) {
  const isNarrow = useIsNarrowViewport();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isNarrow);
  }, [isNarrow]);

  useEffect(() => {
    if (isNarrow) setSidebarOpen(false);
  }, [location.pathname, isNarrow]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const sidebarMotionWidth = sidebarOpen ? sidebarWidth : 0;

  return {
    isNarrow,
    sidebarOpen,
    setSidebarOpen,
    closeSidebar,
    openSidebar,
    sidebarMotionWidth,
    sidebarWidth,
  };
}
