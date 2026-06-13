// localStorage-backed persistence. The only "database" in this app.
// Every access is wrapped in try/catch and guarded for SSR (no window on server).

import type { Destination, MapProvider, Settings, TextSize } from "./types";

const FAVORITES_KEY = "eoc.favorites.v1";
const SETTINGS_KEY = "eoc.settings.v1";

export const SETTINGS_CHANGED_EVENT = "eoc-settings-changed";

const DEFAULT_SETTINGS: Settings = {
  provider: "kakao",
  textSize: "normal",
  highContrast: false,
  voice: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isTransport(v: unknown): v is Destination["transportType"] {
  return v === "transit" || v === "car" || v === "walk";
}

/** Coerce an unknown record into a valid Destination, or null. */
export function coerceDestination(d: unknown): Destination | null {
  if (!d || typeof d !== "object") return null;
  const o = d as Record<string, unknown>;
  if (typeof o.name !== "string" || typeof o.address !== "string") return null;
  if (!isTransport(o.transportType)) return null;
  const out: Destination = {
    id: typeof o.id === "string" ? o.id : makeId(),
    name: o.name,
    address: o.address,
    transportType: o.transportType,
  };
  if (typeof o.memo === "string" && o.memo.trim()) out.memo = o.memo;
  if (typeof o.photo === "string" && o.photo.startsWith("data:image")) out.photo = o.photo;
  if (typeof o.lat === "number" && Number.isFinite(o.lat)) out.lat = o.lat;
  if (typeof o.lng === "number" && Number.isFinite(o.lng)) out.lng = o.lng;
  return out;
}

/** Read and parse the full favorites list. Returns [] on any failure. */
export function getFavorites(): Destination[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceDestination).filter((d): d is Destination => d !== null);
  } catch {
    return [];
  }
}

/** Overwrite the whole favorites list. Returns true on success. */
export function saveFavorites(list: Destination[]): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    return true;
  } catch {
    // Most likely QuotaExceededError (too many/large photos).
    return false;
  }
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Add a new destination; returns the created record, or null if save failed. */
export function addFavorite(input: Omit<Destination, "id">): Destination | null {
  const record: Destination = { ...input, id: makeId() };
  const list = getFavorites();
  list.push(record);
  return saveFavorites(list) ? record : null;
}

/** Update an existing destination by id. Returns the updated list. */
export function updateFavorite(
  id: string,
  patch: Partial<Omit<Destination, "id">>,
): Destination[] {
  const list = getFavorites().map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveFavorites(list);
  return list;
}

/** Delete a destination by id. Returns the remaining list. */
export function deleteFavorite(id: string): Destination[] {
  const list = getFavorites().filter((d) => d.id !== id);
  saveFavorites(list);
  return list;
}

/** Merge an incoming list with the current one, de-duplicating by name+address. */
export function mergeFavorites(incoming: Destination[]): Destination[] {
  const current = getFavorites();
  const seen = new Set(current.map((d) => `${d.name}|${d.address}`.toLowerCase()));
  for (const item of incoming) {
    const key = `${item.name}|${item.address}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    current.push({ ...item, id: makeId() });
  }
  saveFavorites(current);
  return current;
}

function isTextSize(v: unknown): v is TextSize {
  return v === "normal" || v === "large" || v === "xlarge";
}

export function getSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      provider: p.provider === "naver" ? "naver" : "kakao",
      textSize: isTextSize(p.textSize) ? p.textSize : "normal",
      highContrast: p.highContrast === true,
      voice: p.voice === true,
      familyName: typeof p.familyName === "string" ? p.familyName : undefined,
      familyPhone: typeof p.familyPhone === "string" ? p.familyPhone : undefined,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Let the theme applier and any open screen react immediately.
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Patch a subset of settings and persist. Returns the new settings. */
export function patchSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  saveSettings(next);
  return next;
}

export type { MapProvider };
