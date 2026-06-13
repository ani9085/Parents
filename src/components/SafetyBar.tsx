"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings } from "@/lib/storage";
import {
  buildArrivalMessage,
  buildLocationMessage,
  getCurrentLocation,
  openSms,
} from "@/lib/safety";

/**
 * Always-visible safety actions on the home screen, kept separate from the 4
 * main menu buttons. Sends an SMS to the registered family contact — either the
 * current location ("I might be lost / here I am") or an arrival note.
 */
export default function SafetyBar() {
  const [phone, setPhone] = useState<string | undefined>();
  const [busy, setBusy] = useState<null | "loc" | "arrive">(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setPhone(getSettings().familyPhone);
  }, []);

  async function sendLocation() {
    if (!phone) return;
    setBusy("loc");
    setNote("위치를 확인하고 있어요…");
    let loc = null;
    try {
      loc = await getCurrentLocation();
    } catch {
      // Permission denied / timeout — still send a message without coordinates.
      loc = null;
    }
    openSms(phone, buildLocationMessage("", loc));
    setNote(loc ? "문자 앱에서 위치를 보낼 수 있어요." : "위치 없이 문자를 준비했어요.");
    setBusy(null);
  }

  function sendArrival() {
    if (!phone) return;
    setBusy("arrive");
    openSms(phone, buildArrivalMessage(""));
    setNote("도착 문자를 준비했어요.");
    setBusy(null);
  }

  if (!phone) {
    return (
      <div className="eoc-card" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <p className="eoc-muted" style={{ marginBottom: "0.75rem" }}>
          가족 연락처를 등록하면 위치 보내기와 도착 알림을 쓸 수 있어요.
        </p>
        <Link href="/settings" className="eoc-btn eoc-btn--outline">
          ⚙️ 가족 연락처 등록
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <div style={{ display: "flex", gap: "0.85rem" }}>
        <button
          type="button"
          className="eoc-btn eoc-btn--danger"
          onClick={sendLocation}
          disabled={busy !== null}
          style={{ fontSize: "1.35rem" }}
        >
          📍 내 위치 보내기
        </button>
        <button
          type="button"
          className="eoc-btn eoc-btn--accent"
          onClick={sendArrival}
          disabled={busy !== null}
          style={{ fontSize: "1.35rem" }}
        >
          ✅ 도착했어요
        </button>
      </div>
      {note && (
        <p className="eoc-muted" role="status" aria-live="polite" style={{ textAlign: "center" }}>
          {note}
        </p>
      )}
    </div>
  );
}
