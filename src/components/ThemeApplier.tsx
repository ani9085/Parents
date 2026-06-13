"use client";

import { useEffect } from "react";
import { getSettings, SETTINGS_CHANGED_EVENT } from "@/lib/storage";

/**
 * Reads the saved settings and reflects them onto <html> as data attributes so
 * the CSS theme (text size + contrast) applies everywhere. Re-applies whenever
 * settings change (same tab via custom event, other tabs via storage event).
 * Renders nothing.
 */
export default function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const s = getSettings();
      const el = document.documentElement;
      el.setAttribute("data-text-size", s.textSize);
      el.setAttribute("data-contrast", s.highContrast ? "high" : "normal");
    };
    apply();
    window.addEventListener(SETTINGS_CHANGED_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return null;
}
