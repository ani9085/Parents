"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getFavorites, getSettings } from "@/lib/storage";
import { launchDirections } from "@/lib/maps";
import {
  PROVIDER_LABELS,
  TRANSPORT_LABELS,
  type Destination,
  type MapProvider,
} from "@/lib/types";

export default function GoPage() {
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [provider, setProvider] = useState<MapProvider>("kakao");
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    setProvider(getSettings().provider);
    setLoaded(true);
  }, []);

  function handleGo(dest: Destination) {
    setNotice(null);
    try {
      const result = launchDirections(dest, provider);
      if (result.method === "app-attempt") {
        setNotice(
          `${PROVIDER_LABELS[provider]} 앱을 여는 중입니다… 앱이 없으면 잠시 후 인터넷 지도로 안내합니다.`,
        );
      } else {
        setNotice("인터넷 지도를 새 창에서 열었습니다.");
      }
    } catch {
      setNotice("지도를 여는 데 문제가 생겼습니다. 다시 한 번 눌러 주세요.");
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="길찾기" />

      <p style={{ marginBottom: "1.25rem", color: "#475569" }}>
        가려는 곳을 누르면 <b>{PROVIDER_LABELS[provider]}</b>에서 길을 안내합니다.
      </p>

      {notice && (
        <div
          className="eoc-card"
          role="status"
          aria-live="polite"
          style={{ marginBottom: "1.25rem", borderColor: "#1d4ed8", background: "#eff6ff" }}
        >
          {notice}
        </div>
      )}

      {loaded && favorites.length === 0 && (
        <div className="eoc-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.4rem", marginBottom: "1.25rem" }}>
            저장된 장소가 없습니다.
          </p>
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
            onClick={() => handleGo(dest)}
            style={{ flexDirection: "column", gap: "0.3rem", alignItems: "flex-start", minHeight: 100 }}
          >
            <span style={{ fontSize: "1.75rem" }}>🧭 {dest.name}</span>
            <span style={{ fontSize: "1.05rem", fontWeight: 500, opacity: 0.95 }}>
              {dest.address} · {TRANSPORT_LABELS[dest.transportType]}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
