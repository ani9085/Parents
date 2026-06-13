"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { getSettings, patchSettings } from "@/lib/storage";
import {
  PROVIDER_LABELS,
  TEXT_SIZE_LABELS,
  type MapProvider,
  type Settings,
  type TextSize,
} from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function update(patch: Partial<Settings>) {
    const next = patchSettings(patch);
    setSettings(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  if (!settings) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        <PageHeader title="설정" />
      </main>
    );
  }

  const providers: MapProvider[] = ["kakao", "naver"];
  const sizes: TextSize[] = ["normal", "large", "xlarge"];

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="설정" />

      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="eoc-card"
          style={{ marginBottom: "1.25rem", borderColor: "var(--accent)", background: "#ecfdf5", position: "sticky", top: 0, zIndex: 10 }}
        >
          저장되었습니다.
        </div>
      )}

      {/* Map app */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          길찾기에 사용할 지도 앱
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {providers.map((p) => {
            const on = settings.provider === p;
            return (
              <button
                key={p}
                type="button"
                className={on ? "eoc-btn eoc-btn--accent" : "eoc-btn eoc-btn--outline"}
                aria-pressed={on}
                onClick={() => update({ provider: p })}
              >
                {on ? "✅ " : ""}{PROVIDER_LABELS[p]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Text size */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>글씨 크기</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {sizes.map((s) => {
            const on = settings.textSize === s;
            return (
              <button
                key={s}
                type="button"
                className={on ? "eoc-btn eoc-btn--accent" : "eoc-btn eoc-btn--outline"}
                aria-pressed={on}
                onClick={() => update({ textSize: s })}
              >
                {on ? "✅ " : ""}{TEXT_SIZE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </section>

      {/* High contrast */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>더 뚜렷하게 보기</h2>
        <p className="eoc-muted" style={{ marginBottom: "0.75rem" }}>
          배경을 노란색, 글씨를 진한 검정으로 바꿔 더 잘 보이게 합니다.
        </p>
        <button
          type="button"
          className={settings.highContrast ? "eoc-btn eoc-btn--accent" : "eoc-btn eoc-btn--outline"}
          aria-pressed={settings.highContrast}
          onClick={() => update({ highContrast: !settings.highContrast })}
        >
          {settings.highContrast ? "✅ 켜짐 (눌러서 끄기)" : "끄기 (눌러서 켜기)"}
        </button>
      </section>

      {/* Voice */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>음성 안내</h2>
        <p className="eoc-muted" style={{ marginBottom: "0.75rem" }}>
          버튼을 누르면 어디로 가는지 소리로 알려 줍니다.
        </p>
        <button
          type="button"
          className={settings.voice ? "eoc-btn eoc-btn--accent" : "eoc-btn eoc-btn--outline"}
          aria-pressed={settings.voice}
          onClick={() => update({ voice: !settings.voice })}
        >
          {settings.voice ? "✅ 켜짐 (눌러서 끄기)" : "끄기 (눌러서 켜기)"}
        </button>
      </section>

      {/* Family contact */}
      <section>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>가족 연락처</h2>
        <p className="eoc-muted" style={{ marginBottom: "1rem" }}>
          첫 화면의 <b>내 위치 보내기</b>·<b>도착했어요</b> 문자를 받을 번호입니다.
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="fname">가족 이름 (선택)</label>
          <input
            id="fname"
            className="eoc-input"
            placeholder="예: 큰딸"
            defaultValue={settings.familyName ?? ""}
            onBlur={(e) => update({ familyName: e.target.value.trim() || undefined })}
          />
        </div>
        <div>
          <label className="eoc-label" htmlFor="fphone">전화번호</label>
          <input
            id="fphone"
            className="eoc-input"
            type="tel"
            inputMode="tel"
            placeholder="예: 010-1234-5678"
            defaultValue={settings.familyPhone ?? ""}
            onBlur={(e) => update({ familyPhone: e.target.value.trim() || undefined })}
          />
        </div>
      </section>
    </main>
  );
}
