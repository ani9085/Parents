"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites, getPlan, isPlanActiveToday } from "@/lib/storage";
import { TRANSPORT_LABELS, type Destination, type Plan } from "@/lib/types";

/**
 * The "오늘 갈 곳" card at the very top of the home screen. Shows the family-set
 * (or self-set) destination for today as one big button that jumps straight
 * into the directions confirmation for that place. Renders nothing when there
 * is no active plan, so it never clutters the screen.
 */
export default function TodayPlanCard() {
  const [dest, setDest] = useState<Destination | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const p = getPlan();
    if (!isPlanActiveToday(p) || !p) return;
    const match = getFavorites().find((d) => d.id === p.destinationId);
    if (match) {
      setDest(match);
      setPlan(p);
    }
  }, []);

  if (!dest) return null;

  return (
    <Link
      href={`/go?dest=${encodeURIComponent(dest.id)}`}
      className="eoc-btn"
      style={{
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.35rem",
        minHeight: "7rem",
        marginBottom: "1.5rem",
        background: "var(--accent)",
        border: "var(--border-width) solid #f59e0b",
      }}
    >
      <span style={{ fontSize: "1.15rem", fontWeight: 700, opacity: 0.95 }}>
        📅 오늘 갈 곳{plan?.timeLabel ? ` · ${plan.timeLabel}` : ""}
      </span>
      <span style={{ fontSize: "2.1rem" }}>🧭 {dest.name}</span>
      <span style={{ fontSize: "1.05rem", fontWeight: 500, opacity: 0.95 }}>
        눌러서 바로 길찾기 · {TRANSPORT_LABELS[dest.transportType]}
      </span>
    </Link>
  );
}
