// Core data types for the Elderly Outing Coach app.

export type TransportType = "transit" | "car" | "walk";

export interface Destination {
  id: string;
  name: string;
  address: string;
  transportType: TransportType;
}

export type MapProvider = "kakao" | "naver";

export interface Settings {
  provider: MapProvider;
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
