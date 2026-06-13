"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  addFavorite,
  deleteFavorite,
  getFavorites,
  updateFavorite,
} from "@/lib/storage";
import { fileToDownscaledDataUrl } from "@/lib/photo";
import { getCurrentLocation } from "@/lib/safety";
import { TRANSPORT_LABELS, type Destination, type TransportType } from "@/lib/types";

interface FormState {
  name: string;
  address: string;
  transportType: TransportType;
  memo: string;
  photo?: string;
  lat?: number;
  lng?: number;
}

const EMPTY: FormState = { name: "", address: "", transportType: "transit", memo: "" };

export default function PlacesPage() {
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [coordNote, setCoordNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
    setCoordNote(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(dest: Destination) {
    setEditingId(dest.id);
    setForm({
      name: dest.name,
      address: dest.address,
      transportType: dest.transportType,
      memo: dest.memo ?? "",
      photo: dest.photo,
      lat: dest.lat,
      lng: dest.lng,
    });
    setError(null);
    setCoordNote(dest.lat != null ? "좌표가 저장되어 있어요 (정확한 길안내)" : null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진을 불러오지 못했습니다.");
    }
  }

  async function captureCurrentLocation() {
    setCoordNote("현재 위치를 확인하고 있어요…");
    try {
      const loc = await getCurrentLocation();
      setForm((f) => ({ ...f, lat: loc.lat, lng: loc.lng }));
      setCoordNote("✅ 지금 이 위치의 좌표를 저장했어요 (정확한 길안내)");
    } catch {
      setCoordNote("위치를 가져오지 못했어요. 위치 권한을 허용하거나 좌표를 직접 입력해 주세요.");
    }
  }

  function handleManualCoords(value: string) {
    const m = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      setForm((f) => ({ ...f, lat: parseFloat(m[1]), lng: parseFloat(m[2]) }));
      setCoordNote("✅ 좌표를 입력했어요 (정확한 길안내)");
    } else if (value.trim() === "") {
      setForm((f) => ({ ...f, lat: undefined, lng: undefined }));
      setCoordNote(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const address = form.address.trim();
    if (!name) return setError("장소 이름을 입력해 주세요.");
    if (!address) return setError("주소를 입력해 주세요.");

    const record = {
      name,
      address,
      transportType: form.transportType,
      memo: form.memo.trim() || undefined,
      photo: form.photo,
      lat: form.lat,
      lng: form.lng,
    };

    if (editingId) {
      setFavorites(updateFavorite(editingId, record));
    } else {
      const created = addFavorite(record);
      if (!created) {
        return setError("저장 공간이 부족합니다. 사진을 줄이거나 오래된 장소를 삭제해 주세요.");
      }
      setFavorites(getFavorites());
    }
    resetForm();
  }

  function handleDelete(dest: Destination) {
    const ok =
      typeof window === "undefined" || window.confirm(`'${dest.name}'을(를) 삭제할까요?`);
    if (!ok) return;
    setFavorites(deleteFavorite(dest.id));
    if (editingId === dest.id) resetForm();
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <PageHeader title="내 장소 관리" />

      <form onSubmit={handleSubmit} className="eoc-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          {editingId ? "장소 수정" : "새 장소 추가"}
        </h2>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="name">장소 이름</label>
          <input
            id="name"
            className="eoc-input"
            placeholder="예: 큰딸 집"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="address">주소</label>
          <input
            id="address"
            className="eoc-input"
            placeholder="예: 서울시 종로구 세종대로 1"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="transport">이동 방법</label>
          <select
            id="transport"
            className="eoc-select"
            value={form.transportType}
            onChange={(e) => setForm({ ...form, transportType: e.target.value as TransportType })}
          >
            {(Object.keys(TRANSPORT_LABELS) as TransportType[]).map((t) => (
              <option key={t} value={t}>{TRANSPORT_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="memo">가족 메모 (선택)</label>
          <textarea
            id="memo"
            className="eoc-textarea"
            placeholder="예: 병원 도착하면 3층 원무과로 가세요 - 큰딸"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label">목적지 사진 (선택)</label>
          {form.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photo} alt="미리보기" className="eoc-photo" style={{ maxHeight: "12rem", marginBottom: "0.75rem" }} />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="eoc-input"
            style={{ paddingTop: "0.9rem" }}
          />
          {form.photo && (
            <button
              type="button"
              className="eoc-btn eoc-btn--outline"
              style={{ marginTop: "0.6rem", minHeight: "3.5rem", fontSize: "1.2rem" }}
              onClick={() => {
                setForm((f) => ({ ...f, photo: undefined }));
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              사진 지우기
            </button>
          )}
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label className="eoc-label" htmlFor="coords">정확한 위치 좌표 (선택)</label>
          <p className="eoc-muted" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            좌표를 넣으면 지도 앱이 <b>바로 길안내</b>를 시작합니다. 그 장소에 서서 버튼을 누르거나, 위도,경도를 붙여넣으세요.
          </p>
          <button
            type="button"
            className="eoc-btn eoc-btn--outline"
            style={{ marginBottom: "0.6rem", minHeight: "3.6rem", fontSize: "1.2rem" }}
            onClick={captureCurrentLocation}
          >
            📍 지금 이 위치로 저장
          </button>
          <input
            id="coords"
            className="eoc-input"
            placeholder="예: 37.5759, 126.9769"
            defaultValue={form.lat != null && form.lng != null ? `${form.lat}, ${form.lng}` : ""}
            onChange={(e) => handleManualCoords(e.target.value)}
          />
          {coordNote && (
            <p className="eoc-muted" style={{ marginTop: "0.5rem" }}>{coordNote}</p>
          )}
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--danger)", fontWeight: 700, marginBottom: "1rem", fontSize: "1.2rem" }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button type="submit" className="eoc-btn eoc-btn--accent">
            {editingId ? "저장하기" : "추가하기"}
          </button>
          {editingId && (
            <button type="button" className="eoc-btn eoc-btn--outline" onClick={resetForm}>
              취소
            </button>
          )}
        </div>
      </form>

      <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
        저장된 장소 ({favorites.length})
      </h2>

      {favorites.length === 0 ? (
        <p className="eoc-muted" style={{ fontSize: "1.3rem" }}>
          아직 저장된 장소가 없습니다. 위에서 추가해 보세요.
        </p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none", padding: 0 }}>
          {favorites.map((dest) => (
            <li key={dest.id} className="eoc-card">
              <div style={{ display: "flex", gap: "0.85rem", marginBottom: "0.85rem" }}>
                {dest.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dest.photo} alt="" className="eoc-thumb" />
                )}
                <div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{dest.name}</div>
                  <div className="eoc-muted" style={{ fontSize: "1.1rem", marginTop: "0.25rem" }}>
                    {dest.address}
                  </div>
                  <div className="eoc-muted" style={{ fontSize: "1.1rem" }}>
                    {TRANSPORT_LABELS[dest.transportType]}
                    {dest.lat != null ? " · 좌표 ✓" : ""}
                    {dest.memo ? " · 메모 ✓" : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="eoc-btn eoc-btn--outline"
                  style={{ minHeight: "3.6rem", fontSize: "1.3rem" }}
                  onClick={() => startEdit(dest)}
                >
                  ✏️ 수정
                </button>
                <button
                  type="button"
                  className="eoc-btn eoc-btn--danger"
                  style={{ minHeight: "3.6rem", fontSize: "1.3rem" }}
                  onClick={() => handleDelete(dest)}
                >
                  🗑️ 삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
