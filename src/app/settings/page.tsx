"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { getSettings, saveSettings } from "@/lib/storage";
import { PROVIDER_LABELS, type MapProvider } from "@/lib/types";

export default function SettingsPage() {
  const [provider, setProvider] = useState<MapProvider>("kakao");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProvider(getSettings().provider);
  }, []);

  function choose(next: MapProvider) {
    setProvider(next);
    saveSettings({ provider: next });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  const providers: MapProvider[] = ["kakao", "naver"];

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="설정" />

      <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
        길찾기에 사용할 지도 앱
      </h2>
      <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
        평소에 쓰시는 지도 앱을 골라 주세요.
      </p>

      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="eoc-card"
          style={{ marginBottom: "1.25rem", borderColor: "#047857", background: "#ecfdf5" }}
        >
          저장되었습니다.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {providers.map((p) => {
          const selected = provider === p;
          return (
            <button
              key={p}
              type="button"
              className={selected ? "eoc-btn eoc-btn--accent" : "eoc-btn eoc-btn--outline"}
              onClick={() => choose(p)}
              aria-pressed={selected}
            >
              {selected ? "✅ " : ""}
              {PROVIDER_LABELS[p]}
            </button>
          );
        })}
      </div>
    </main>
  );
}
