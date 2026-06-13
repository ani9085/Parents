"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getFavorites, getSettings } from "@/lib/storage";
import { launchDirections } from "@/lib/maps";
import { speak, tapFeedback } from "@/lib/feedback";
import {
  PROVIDER_LABELS,
  TRANSPORT_LABELS,
  type Destination,
  type MapProvider,
} from "@/lib/types";

export default function GoPage() {
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [provider, setProvider] = useState<MapProvider>("kakao");
  const [voice, setVoice] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // The place the user tapped — shown in the confirmation card.
  const [selected, setSelected] = useState<Destination | null>(null);
  // While launching, a full-screen overlay blocks repeat taps.
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    const s = getSettings();
    setProvider(s.provider);
    setVoice(s.voice);
    setLoaded(true);

    // Deep-linked from the home "오늘 갈 곳" card: open its confirm card.
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("dest");
      if (id) {
        const match = favs.find((d) => d.id === id);
        if (match) setSelected(match);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function confirmDestination(dest: Destination) {
    tapFeedback();
    setSelected(dest);
  }

  function startNavigation() {
    if (!selected || launching) return;
    const dest = selected;
    tapFeedback();
    setLaunching(true);
    speak(`${dest.name}으로 가는 길을 찾습니다.`, voice);

    // Brief delay so the overlay + voice register before the app switch.
    window.setTimeout(() => {
      try {
        launchDirections(dest, provider);
      } catch {
        /* maps util already handles its own fallback */
      }
    }, 500);

    // Clear the blocking overlay after the hand-off window.
    window.setTimeout(() => {
      setLaunching(false);
      setSelected(null);
    }, 3500);
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="길찾기" />

      <p className="eoc-muted" style={{ marginBottom: "1.25rem" }}>
        가려는 곳을 누르면 <b>{PROVIDER_LABELS[provider]}</b>에서 길을 안내합니다.
      </p>

      {loaded && favorites.length === 0 && (
        <div className="eoc-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.4rem", marginBottom: "1.25rem" }}>저장된 장소가 없습니다.</p>
          <Link href="/places" className="eoc-btn eoc-btn--accent">
            ⭐ 장소 추가하기
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {favorites.map((dest) => (
          <button
            key={dest.id}
            type="button"
            className="eoc-btn"
            onClick={() => confirmDestination(dest)}
            style={{ justifyContent: "flex-start", gap: "1rem", minHeight: "5.5rem" }}
          >
            {dest.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dest.photo} alt="" className="eoc-thumb" />
            ) : (
              <span style={{ fontSize: "2.4rem", flexShrink: 0 }}>🧭</span>
            )}
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
              <span style={{ fontSize: "1.7rem" }}>{dest.name}</span>
              <span style={{ fontSize: "1rem", fontWeight: 500, opacity: 0.95 }}>
                {TRANSPORT_LABELS[dest.transportType]}
                {dest.memo ? " · 가족 메모 있음" : ""}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Confirmation card — photo + family memo + transport, then launch. */}
      {selected && !launching && (
        <div
          className="eoc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div className="eoc-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.75rem" }}>
              {selected.name}
            </h2>

            {selected.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photo}
                alt={`${selected.name} 사진`}
                className="eoc-photo"
                style={{ maxHeight: "16rem", marginBottom: "1rem" }}
              />
            )}

            <p className="eoc-muted" style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
              {selected.address}
            </p>

            {selected.memo && (
              <div
                className="eoc-card"
                style={{
                  background: "#fffbeb",
                  borderColor: "#f59e0b",
                  marginBottom: "1rem",
                  fontSize: "1.45rem",
                  lineHeight: 1.5,
                }}
              >
                💌 {selected.memo}
              </div>
            )}

            <p style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              이동 방법: {TRANSPORT_LABELS[selected.transportType]}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <button type="button" className="eoc-btn eoc-btn--accent" onClick={startNavigation}>
                🧭 이대로 길찾기 시작
              </button>
              <button
                type="button"
                className="eoc-btn eoc-btn--outline"
                onClick={() => setSelected(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocking overlay so the 1–2s app hand-off isn't tapped repeatedly. */}
      {launching && (
        <div className="eoc-overlay" role="status" aria-live="assertive">
          <div className="eoc-overlay__icon">⏳</div>
          <div className="eoc-overlay__text">지도를 준비하고 있어요…</div>
          <div style={{ fontSize: "1.2rem", opacity: 0.85 }}>잠시만 기다려 주세요</div>
        </div>
      )}
    </main>
  );
}
