// Family-sharing codec.
//
// A child configures the parent's phone by sharing a single string (or QR code)
// that encodes the favorites list AND the family contact / map preference. We
// serialize to JSON, then to URL-safe base64 (UTF-8 aware, so Korean survives).

import { coerceDestination } from "./storage";
import type { Destination, MapProvider, TextSize } from "./types";

export interface ShareConfig {
  provider?: MapProvider;
  familyName?: string;
  familyPhone?: string;
  textSize?: TextSize;
  highContrast?: boolean;
  voice?: boolean;
}

interface SharePayload {
  v: 2;
  favorites: Destination[];
  config?: ShareConfig;
}

export interface DecodedShare {
  favorites: Destination[];
  config?: ShareConfig;
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

/** Encode favorites (+ optional config) into a copy/paste-friendly code. */
export function encodeFavorites(favorites: Destination[], config?: ShareConfig): string {
  const payload: SharePayload = { v: 2, favorites };
  if (config && Object.keys(config).length > 0) payload.config = config;
  return toUrlSafe(utf8ToBase64(JSON.stringify(payload)));
}

/**
 * Decode a share code. Accepts the bare code or a full URL (reads after
 * `#data=` / `?data=`). Returns null on malformed input.
 */
export function decodeShare(input: string): DecodedShare | null {
  if (!input) return null;
  let code = input.trim();
  const m = code.match(/[#?&]data=([^&\s]+)/);
  if (m) code = m[1];

  try {
    const json = base64ToUtf8(fromUrlSafe(code));
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (!parsed || !Array.isArray(parsed.favorites)) return null;
    const favorites = parsed.favorites
      .map(coerceDestination)
      .filter((d): d is Destination => d !== null);
    return { favorites, config: parsed.config };
  } catch {
    return null;
  }
}

/** Build a full URL that opens the import screen pre-loaded with the data. */
export function buildShareUrl(favorites: Destination[], config?: ShareConfig): string {
  const code = encodeFavorites(favorites, config);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://example.com";
  return `${origin}/share#data=${code}`;
}
