"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  addFavorite,
  deleteFavorite,
  getFavorites,
  updateFavorite,
} from "@/lib/storage";
import { TRANSPORT_LABELS, type Destination, type TransportType } from "@/lib/types";

const EMPTY = { name: "", address: "", transportType: "transit" as TransportType };

export default function PlacesPage() {
  const [favorites, setFavorites] = useState<Destination[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
  }

  function startEdit(dest: Destination) {
    setEditingId(dest.id);
    setForm({ name: dest.name, address: dest.address, transportType: dest.transportType });
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const address = form.address.trim();
    if (!name) {
      setError("장소 이름을 입력해 주세요.");
      return;
    }
    if (!address) {
      setError("주소를 입력해 주세요.");
      return;
    }

    if (editingId) {
      setFavorites(updateFavorite(editingId, { name, address, transportType: form.transportType }));
    } else {
      addFavorite({ name, address, transportType: form.transportType });
      setFavorites(getFavorites());
    }
    resetForm();
  }

  function handleDelete(dest: Destination) {
    const ok =
      typeof window === "undefined" ||
      window.confirm(`'${dest.name}'을(를) 삭제할까요?`);
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
          <label className="eoc-label" htmlFor="name">
            장소 이름
          </label>
          <input
            id="name"
            className="eoc-input"
            placeholder="예: 큰딸 집"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="eoc-label" htmlFor="address">
            주소
          </label>
          <input
            id="address"
            className="eoc-input"
            placeholder="예: 서울시 종로구 세종대로 1"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label className="eoc-label" htmlFor="transport">
            이동 방법
          </label>
          <select
            id="transport"
            className="eoc-select"
            value={form.transportType}
            onChange={(e) =>
              setForm({ ...form, transportType: e.target.value as TransportType })
            }
          >
            {(Object.keys(TRANSPORT_LABELS) as TransportType[]).map((t) => (
              <option key={t} value={t}>
                {TRANSPORT_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            style={{ color: "#b91c1c", fontWeight: 700, marginBottom: "1rem", fontSize: "1.2rem" }}
          >
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
        <p style={{ color: "#475569", fontSize: "1.3rem" }}>
          아직 저장된 장소가 없습니다. 위에서 추가해 보세요.
        </p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none", padding: 0 }}>
          {favorites.map((dest) => (
            <li key={dest.id} className="eoc-card">
              <div style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{dest.name}</div>
                <div style={{ fontSize: "1.15rem", color: "#475569", marginTop: "0.25rem" }}>
                  {dest.address}
                </div>
                <div style={{ fontSize: "1.15rem", color: "#475569" }}>
                  이동 방법: {TRANSPORT_LABELS[dest.transportType]}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="eoc-btn eoc-btn--outline"
                  style={{ minHeight: 72, fontSize: "1.3rem" }}
                  onClick={() => startEdit(dest)}
                >
                  ✏️ 수정
                </button>
                <button
                  type="button"
                  className="eoc-btn eoc-btn--danger"
                  style={{ minHeight: 72, fontSize: "1.3rem" }}
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
