"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import PageHeader from "@/components/PageHeader";
import { getFavorites, mergeFavorites } from "@/lib/storage";
import { buildShareUrl, decodeFavorites, encodeFavorites } from "@/lib/share";
import { TRANSPORT_LABELS, type Destination } from "@/lib/types";

export default function SharePage() {
  // Share side
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Import side
  const [pasted, setPasted] = useState("");
  const [incoming, setIncoming] = useState<Destination[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState<number | null>(null);

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    const url = buildShareUrl(favs);
    setShareUrl(url);
    setShareCode(encodeFavorites(favs));

    if (favs.length > 0) {
      QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }

    // If opened from a shared link, pre-load the import preview.
    if (typeof window !== "undefined") {
      const fromUrl = window.location.hash || window.location.search;
      if (fromUrl && /data=/.test(fromUrl)) {
        const decoded = decodeFavorites(fromUrl);
        if (decoded && decoded.length > 0) {
          setIncoming(decoded);
          setPasted(fromUrl);
        } else {
          setImportError("공유 링크의 내용을 읽지 못했습니다.");
        }
      }
    }
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the textarea below lets them copy manually.
      setCopied(false);
    }
  }

  function handlePreview() {
    setImportError(null);
    setImportDone(null);
    const decoded = decodeFavorites(pasted);
    if (!decoded || decoded.length === 0) {
      setIncoming(null);
      setImportError("코드를 읽지 못했습니다. 받은 코드를 다시 확인해 주세요.");
      return;
    }
    setIncoming(decoded);
  }

  function handleImport() {
    if (!incoming) return;
    const before = getFavorites().length;
    const merged = mergeFavorites(incoming);
    setFavorites(merged);
    setIncoming(null);
    setPasted("");
    setImportDone(merged.length - before);
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="가족과 공유" />

      {/* ---- Share out ---- */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          내 장소 보내기
        </h2>
        <p style={{ color: "#475569", marginBottom: "1.25rem" }}>
          자녀가 아래 QR을 찍거나 코드를 받아, 같은 장소를 부모님 휴대폰에 넣어 드릴 수 있어요.
        </p>

        {favorites.length === 0 ? (
          <div className="eoc-card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
              보낼 장소가 없습니다.
            </p>
            <Link href="/places" className="eoc-btn eoc-btn--accent">
              ⭐ 장소 추가하기
            </Link>
          </div>
        ) : (
          <div className="eoc-card">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="공유 QR 코드"
                width={280}
                height={280}
                style={{ display: "block", margin: "0 auto 1rem", maxWidth: "100%", height: "auto" }}
              />
            ) : (
              <p style={{ textAlign: "center", marginBottom: "1rem" }}>QR 코드를 만드는 중…</p>
            )}

            <label className="eoc-label" htmlFor="code">
              공유 코드
            </label>
            <textarea
              id="code"
              readOnly
              className="eoc-input"
              style={{ minHeight: 120, fontFamily: "monospace", fontSize: "1rem" }}
              value={shareCode}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="eoc-btn"
              style={{ marginTop: "1rem" }}
              onClick={handleCopy}
            >
              {copied ? "✅ 복사됨" : "📋 코드 복사"}
            </button>
          </div>
        )}
      </section>

      {/* ---- Import ---- */}
      <section>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          받은 장소 가져오기
        </h2>
        <p style={{ color: "#475569", marginBottom: "1.25rem" }}>
          가족에게 받은 코드를 아래에 붙여 넣으세요.
        </p>

        <div className="eoc-card">
          <textarea
            className="eoc-input"
            style={{ minHeight: 120, fontFamily: "monospace", fontSize: "1rem" }}
            placeholder="여기에 코드를 붙여 넣으세요"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <button
            type="button"
            className="eoc-btn eoc-btn--outline"
            style={{ marginTop: "1rem" }}
            onClick={handlePreview}
            disabled={!pasted.trim()}
          >
            🔍 미리 보기
          </button>

          {importError && (
            <p role="alert" style={{ color: "#b91c1c", fontWeight: 700, marginTop: "1rem", fontSize: "1.2rem" }}>
              {importError}
            </p>
          )}

          {importDone !== null && (
            <p
              role="status"
              style={{ color: "#047857", fontWeight: 700, marginTop: "1rem", fontSize: "1.2rem" }}
            >
              {importDone > 0
                ? `${importDone}곳을 새로 추가했습니다.`
                : "이미 모두 저장되어 있어 추가된 곳은 없습니다."}
            </p>
          )}

          {incoming && (
            <div style={{ marginTop: "1.25rem" }}>
              <p style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.2rem" }}>
                받은 장소 {incoming.length}곳:
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {incoming.map((d, i) => (
                  <li key={i} style={{ fontSize: "1.15rem" }}>
                    • <b>{d.name}</b> — {d.address} ({TRANSPORT_LABELS[d.transportType]})
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="eoc-btn eoc-btn--accent"
                style={{ marginTop: "1.25rem" }}
                onClick={handleImport}
              >
                ⬇️ 내 휴대폰에 저장하기
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
