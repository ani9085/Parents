// Sensory feedback helpers: haptic vibration + spoken guidance (TTS).
// All are best-effort and silently no-op where unsupported.

/** Short vibration so the user feels their tap registered. */
export async function tapFeedback(): Promise<void> {
  try {
    // Capacitor Haptics (native). Has a web shim using navigator.vibrate.
    const mod = await import("@capacitor/haptics");
    await mod.Haptics.impact({ style: mod.ImpactStyle.Medium });
    return;
  } catch {
    /* fall through to web vibrate */
  }
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }
  } catch {
    /* ignore */
  }
}

/** Speak a short Korean sentence. No-op unless enabled and supported. */
export function speak(text: string, enabled: boolean): void {
  if (!enabled || !text) return;
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
