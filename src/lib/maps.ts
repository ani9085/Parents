// Map launching utility.
//
// Two modes, chosen automatically:
//  1. If the destination has coordinates (lat/lng), we build a real ROUTE deep
//     link that opens directly into route results for the chosen transport mode
//     (start = the user's current location, which both apps default to).
//  2. Otherwise we fall back to a SEARCH deep link by address.
//
// In both cases, if the native app does not take over within ~1.6s we open the
// web map instead. The hand-off is detected via `visibilitychange`.

import type { Destination, MapProvider, TransportType } from "./types";

function queryFor(dest: Destination): string {
  return (dest.address?.trim() || dest.name?.trim() || "").trim();
}

function hasCoords(dest: Destination): dest is Destination & { lat: number; lng: number } {
  return typeof dest.lat === "number" && typeof dest.lng === "number";
}

interface MapLinks {
  appUrl: string;
  webUrl: string;
  /** True when we could build a real route (coords present). */
  isRoute: boolean;
}

const KAKAO_BY: Record<TransportType, string> = {
  transit: "PUBLICTRANSIT",
  car: "CAR",
  walk: "FOOT",
};
const NAVER_ROUTE: Record<TransportType, string> = {
  transit: "public",
  car: "car",
  walk: "walk",
};

export function buildMapLinks(dest: Destination, provider: MapProvider): MapLinks {
  const q = queryFor(dest);
  const enc = encodeURIComponent(q);
  const nameEnc = encodeURIComponent(dest.name?.trim() || q);

  if (provider === "naver") {
    if (hasCoords(dest)) {
      const mode = NAVER_ROUTE[dest.transportType];
      const appUrl =
        `nmap://route/${mode}?dlat=${dest.lat}&dlng=${dest.lng}` +
        `&dname=${nameEnc}&appname=com.eoc.outingcoach`;
      const webUrl = `https://map.naver.com/p/directions/-/${dest.lng},${dest.lat},${nameEnc}/-/${mode}`;
      return { appUrl, webUrl, isRoute: true };
    }
    return {
      appUrl: `nmap://search?query=${enc}&appname=com.eoc.outingcoach`,
      webUrl: `https://map.naver.com/p/search/${enc}`,
      isRoute: false,
    };
  }

  // Kakao (default)
  if (hasCoords(dest)) {
    const by = KAKAO_BY[dest.transportType];
    // ep = end point "lat,lng"; sp omitted => current location.
    const appUrl = `kakaomap://route?ep=${dest.lat},${dest.lng}&by=${by}`;
    const webUrl = `https://map.kakao.com/link/to/${nameEnc},${dest.lat},${dest.lng}`;
    return { appUrl, webUrl, isRoute: true };
  }
  return {
    appUrl: `kakaomap://search?q=${enc}`,
    webUrl: `https://map.kakao.com/?q=${enc}`,
    isRoute: false,
  };
}

export interface LaunchResult {
  method: "app-attempt" | "web";
  webUrl: string;
  isRoute: boolean;
}

/**
 * Attempt to open the native map app, falling back to the web map.
 * Safe to call only in the browser. On desktop it goes straight to web.
 */
export function launchDirections(dest: Destination, provider: MapProvider): LaunchResult {
  const { appUrl, webUrl, isRoute } = buildMapLinks(dest, provider);

  if (typeof window === "undefined") {
    return { method: "web", webUrl, isRoute };
  }

  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  if (!isMobile) {
    openWeb(webUrl);
    return { method: "web", webUrl, isRoute };
  }

  let settled = false;
  const fallbackTimer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    openWeb(webUrl);
  }, 1600);

  const onHidden = () => {
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

  return { method: "app-attempt", webUrl, isRoute };
}

function openWeb(webUrl: string) {
  try {
    const win = window.open(webUrl, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = webUrl;
  } catch {
    window.location.href = webUrl;
  }
}
