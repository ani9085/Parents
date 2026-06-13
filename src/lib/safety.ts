// "Send my location to family" / "I arrived safely" helpers.
// Uses the browser Geolocation API + an `sms:` URI to the family contact.

export interface GeoResult {
  lat: number;
  lng: number;
}

/** Get the current position with a sane timeout. Rejects on denial/failure. */
export function getCurrentLocation(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 기기는 위치 기능을 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  });
}

function googleMapsLink(loc: GeoResult): string {
  return `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
}

/** Open the SMS app to the family number with a prefilled message. */
export function openSms(phone: string, body: string): void {
  // Strip spaces/dashes from the number for the URI.
  const num = phone.replace(/[^0-9+]/g, "");
  // `?body=` works on Android; iOS prefers `&body=`. Most modern OSes accept ?.
  const uri = `sms:${num}?body=${encodeURIComponent(body)}`;
  try {
    window.location.href = uri;
  } catch {
    /* ignore */
  }
}

/** Build the "I'm here / lost" message, with a map link when available. */
export function buildLocationMessage(
  senderLabel: string,
  loc: GeoResult | null,
): string {
  const who = senderLabel ? `${senderLabel} ` : "";
  if (loc) {
    return `${who}지금 제 위치입니다. ${googleMapsLink(loc)}`;
  }
  return `${who}지금 위치를 확인할 수 없어요. 연락 부탁드려요.`;
}

export function buildArrivalMessage(senderLabel: string): string {
  const who = senderLabel ? `${senderLabel} ` : "";
  return `${who}무사히 도착했어요. 걱정 마세요.`;
}
