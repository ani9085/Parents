"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings } from "@/lib/storage";
import { buildLocationMessage, getCurrentLocation, openSms } from "@/lib/safety";

// One-tap check-in phrases so the senior can reassure family without typing.
const QUICK_MESSAGES = [
  "잘 도착했어요",
  "조금 늦어요",
  "집에 가는 중이에요",
  "데리러 와줄래?",
];

/**
 * Home-screen safety + check-in actions, kept separate from the 4 main menu
 * buttons. Sends an SMS to the registered family contact: either the current
 * location ("here I am / I might be lost") or a one-tap reassurance message.
 */
export default function SafetyBar() {
  const [phone, setPhone] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setPhone(getSettings().familyPhone);
  }, []);

  async function sendLocation() {
    if (!phone) return;
    setBusy(true);
    setNote("위치를 확인하고 있어요…");
    let loc = null;
    try {
      loc = await getCurrentLocation();
    } catch {
      loc = null; // permission denied / timeout — still send a message
    }
    openSms(phone, buildLocationMessage("", loc));
    setNote(loc ? "문자 앱에서 위치를 보낼 수 있어요." : "위치 없이 문자를 준비했어요.");
    setBusy(false);
  }

  function sendQuick(message: string) {
    if (!phone) return;
    openSms(phone, message);
    setNote("문자 앱에서 보내기를 누르면 전송됩니다.");
  }

  if (!phone) {
    return (
      <div className="eoc-card" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <p className="eoc-muted" style={{ marginBottom: "0.75rem" }}>
          가족 연락처를 등록하면 위치 보내기와 안부 문자를 쓸 수 있어요.
        </p>
        <Link href="/settings" className="eoc-btn eoc-btn--outline">
          ⚙️ 가족 연락처 등록
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <button
        type="button"
        className="eoc-btn eoc-btn--danger"
        onClick={sendLocation}
        disabled={busy}
      >
        📍 내 위치 가족에게 보내기
      </button>

      <div>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem" }}>
          💬 가족에게 안부
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {QUICK_MESSAGES.map((m) => (
            <button
              key={m}
              type="button"
              className="eoc-btn eoc-btn--outline"
              onClick={() => sendQuick(m)}
              style={{ fontSize: "1.25rem", minHeight: "4rem" }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {note && (
        <p className="eoc-muted" role="status" aria-live="polite" style={{ textAlign: "center" }}>
          {note}
        </p>
      )}
    </div>
  );
}
