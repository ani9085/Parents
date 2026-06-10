// Family-sharing codec.
//
// A child configures the parent's phone by sharing a single string (or QR code)
// that encodes the favorites list. We serialize to JSON, then to URL-safe
// base64 (UTF-8 aware, so Korean names survive the round trip).

import type { Destination } from "./types";

interface SharePayload {
  v: 1;
  favorites: Destination[];
}

// --- UTF-8 safe base64 helpers (browser) ---

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(s: string): string {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return b64;
}

/** Encode favorites into a compact, copy/paste-friendly code. */
export function encodeFavorites(favorites: Destination[]): string {
  const payload: SharePayload = { v: 1, favorites };
  return toUrlSafe(utf8ToBase64(JSON.stringify(payload)));
}

/**
 * Decode a share code back into favorites. Accepts either the bare code or a
 * full share URL (we read the part after `#data=` or `?data=`). Returns null on
 * any malformed input.
 */
export function decodeFavorites(input: string): Destination[] | null {
  if (!input) return null;
  let code = input.trim();

  // Allow pasting a full URL.
  const hashMatch = code.match(/[#?&]data=([^&\s]+)/);
  if (hashMatch) code = hashMatch[1];

  try {
    const json = base64ToUtf8(fromUrlSafe(code));
    const parsed = JSON.parse(json) as SharePayload;
    if (!parsed || !Array.isArray(parsed.favorites)) return null;
    return parsed.favorites.filter(
      (d): d is Destination =>
        d &&
        typeof d.name === "string" &&
        typeof d.address === "string" &&
        (d.transportType === "transit" ||
          d.transportType === "car" ||
          d.transportType === "walk"),
    );
  } catch {
    return null;
  }
}

/** Build a full URL that opens the import screen pre-loaded with the data. */
export function buildShareUrl(favorites: Destination[]): string {
  const code = encodeFavorites(favorites);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://example.com";
  return `${origin}/share#data=${code}`;
}
