import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathRef = useRef(pathname + search);

  useEffect(() => {
    const currentPath = pathname + search;
    const prevPath = prevPathRef.current;
    prevPathRef.current = currentPath;

    // Only scroll to top when navigating forward (not when going back via browser back)
    const isBackNavigation = window.history.state?.idx !== undefined &&
      (window.history.state?.idx || 0) < ((window as any).__fitverse_lastIdx || 0);

    (window as any).__fitverse_lastIdx = window.history.state?.idx;

    // Check if it's a popstate (back/forward) - don't scroll on those
    if (isBackNavigation) return;

    // Scroll to top only if it's a new page navigation (not browser back)
    if (currentPath !== prevPath) {
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);

  return null;
}