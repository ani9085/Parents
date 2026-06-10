// Map launching utility.
//
// Given a destination (name + address only — we do NOT store coordinates), we
// try to open the native Kakao/Naver map app via its URL scheme, and if the app
// does not respond within a short window we fall back to the web map.
//
// The fallback works by listening for the page becoming hidden: when a native
// app successfully takes over, the browser tab is backgrounded and
// `visibilitychange` fires. If that never happens, the app isn't installed and
// we navigate to the web URL instead.

import type { Destination, MapProvider, TransportType } from "./types";

// What we actually search for: prefer the address, fall back to the name.
function queryFor(dest: Destination): string {
  return (dest.address?.trim() || dest.name?.trim() || "").trim();
}

interface MapLinks {
  appUrl: string;
  webUrl: string;
}

// Map our transport types onto each provider's web routing mode keyword.
const KAKAO_MODE: Record<TransportType, string> = {
  transit: "PUBLICTRANSIT",
  car: "CAR",
  walk: "FOOT",
};
const NAVER_MODE: Record<TransportType, string> = {
  transit: "transit",
  car: "car",
  walk: "walk",
};

/**
 * Build the app-scheme URL and the web fallback URL for a destination.
 *
 * Because we only have an address (no lat/lng), we use each provider's *search*
 * deep link — this geocodes the place and shows it with a one-tap "길찾기"
 * (directions) button inside the native app, which is the most reliable
 * address-only behavior. The web fallback opens the place / directions search.
 */
export function buildMapLinks(dest: Destination, provider: MapProvider): MapLinks {
  const q = queryFor(dest);
  const enc = encodeURIComponent(q);

  if (provider === "naver") {
    // appname is required by Naver's scheme; any stable identifier works.
    const appUrl = `nmap://search?query=${enc}&appname=com.eoc.outingcoach`;
    const webUrl = `https://map.naver.com/p/search/${enc}`;
    // Note mode is reflected in the web search; native app lets user pick.
    void NAVER_MODE[dest.transportType];
    return { appUrl, webUrl };
  }

  // Kakao (default)
  const appUrl = `kakaomap://search?q=${enc}`;
  const webUrl = `https://map.kakao.com/?q=${enc}`;
  void KAKAO_MODE[dest.transportType];
  return { appUrl, webUrl };
}

export interface LaunchResult {
  /** Which path we ultimately took. */
  method: "app-attempt" | "web";
  webUrl: string;
}

/**
 * Attempt to open the native map app, falling back to the web map.
 *
 * Returns a promise that resolves once we've decided what happened. Safe to call
 * only in the browser. On desktop (no app installed) it goes straight to web.
 */
export function launchDirections(dest: Destination, provider: MapProvider): LaunchResult {
  const { appUrl, webUrl } = buildMapLinks(dest, provider);

  if (typeof window === "undefined") {
    return { method: "web", webUrl };
  }

  // On desktops the custom schemes just error out and can show ugly prompts, so
  // we skip straight to the web map there.
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  if (!isMobile) {
    openWeb(webUrl);
    return { method: "web", webUrl };
  }

  let settled = false;
  const fallbackTimer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    openWeb(webUrl);
  }, 1500);

  const onHidden = () => {
    // The native app took focus — cancel the web fallback.
    if (document.hidden) {
      settled = true;
      window.clearTimeout(fallbackTimer);
      cleanup();
    }
  };

  function cleanup() {
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("pagehide", onHidden);
  }

  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", onHidden);

  // Trigger the app scheme. Wrapped in try/catch: a blocked/invalid scheme must
  // never crash the page — the timer above will still fire the web fallback.
  try {
    window.location.href = appUrl;
  } catch {
    if (!settled) {
      settled = true;
      window.clearTimeout(fallbackTimer);
      cleanup();
      openWeb(webUrl);
    }
  }

  return { method: "app-attempt", webUrl };
}

function openWeb(webUrl: string) {
  try {
    // New tab keeps our app alive behind the map.
    const win = window.open(webUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // Popup blocked — navigate in place as a last resort.
      window.location.href = webUrl;
    }
  } catch {
    window.location.href = webUrl;
  }
}
