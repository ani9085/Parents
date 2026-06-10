// localStorage-backed persistence. The only "database" in this app.
// Every access is wrapped in try/catch and guarded for SSR (no window on server).

import type { Destination, Settings } from "./types";

const FAVORITES_KEY = "eoc.favorites.v1";
const SETTINGS_KEY = "eoc.settings.v1";

const DEFAULT_SETTINGS: Settings = { provider: "kakao" };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Read and parse the full favorites list. Returns [] on any failure. */
export function getFavorites(): Destination[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: keep only well-formed records.
    return parsed.filter(
      (d): d is Destination =>
        d &&
        typeof d.id === "string" &&
        typeof d.name === "string" &&
        typeof d.address === "string" &&
        (d.transportType === "transit" ||
          d.transportType === "car" ||
          d.transportType === "walk"),
    );
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
    return false;
  }
}

function makeId(): string {
  // crypto.randomUUID is widely available; fall back if missing.
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Add a new destination; returns the created record. */
export function addFavorite(input: Omit<Destination, "id">): Destination {
  const record: Destination = { ...input, id: makeId() };
  const list = getFavorites();
  list.push(record);
  saveFavorites(list);
  return record;
}

/** Update an existing destination by id. Returns the updated list. */
export function updateFavorite(id: string, patch: Partial<Omit<Destination, "id">>): Destination[] {
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

export function getSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed?.provider === "kakao" || parsed?.provider === "naver") {
      return { provider: parsed.provider };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
