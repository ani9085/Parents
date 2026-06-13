// Core data types for the Elderly Outing Coach app.

export type TransportType = "transit" | "car" | "walk";

export interface Destination {
  id: string;
  name: string;
  address: string;
  transportType: TransportType;
  // --- Optional, family-curated extras (the app's differentiators) ---
  /** A short reassuring note from family, shown big before the map opens. */
  memo?: string;
  /** Downscaled JPEG data URL of the destination (e.g. the entrance). */
  photo?: string;
  /** Destination latitude — enables real turn-by-turn route deep links. */
  lat?: number;
  /** Destination longitude. */
  lng?: number;
}

export type MapProvider = "kakao" | "naver";

export type TextSize = "normal" | "large" | "xlarge";

export interface Settings {
  provider: MapProvider;
  textSize: TextSize;
  highContrast: boolean;
  /** Spoken guidance via Web Speech API. Off by default (public-place friendly). */
  voice: boolean;
  /** Family contact for the location-sharing / arrival buttons. */
  familyName?: string;
  familyPhone?: string;
}

// Human-friendly Korean labels used throughout the UI.
export const TRANSPORT_LABELS: Record<TransportType, string> = {
  transit: "대중교통",
  car: "자동차",
  walk: "도보",
};

export const PROVIDER_LABELS: Record<MapProvider, string> = {
  kakao: "카카오맵",
  naver: "네이버 지도",
};

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: "보통",
  large: "크게",
  xlarge: "아주 크게",
};
