import Link from "next/link";
import SafetyBar from "@/components/SafetyBar";
import TodayPlanCard from "@/components/TodayPlanCard";

// Main dashboard. Deliberately limited to 4 large buttons so the screen is
// never overwhelming, with a separate safety bar (SOS / arrival) below.

const MENU = [
  {
    href: "/go",
    label: "길찾기",
    sub: "저장한 곳으로 출발",
    icon: "🧭",
    className: "eoc-btn",
  },
  {
    href: "/places",
    label: "내 장소 관리",
    sub: "추가 · 수정 · 삭제",
    icon: "⭐",
    className: "eoc-btn eoc-btn--accent",
  },
  {
    href: "/share",
    label: "가족과 공유",
    sub: "자녀가 설정 도와주기",
    icon: "👨‍👩‍👧",
    className: "eoc-btn",
  },
  {
    href: "/settings",
    label: "설정",
    sub: "지도 앱 선택",
    icon: "⚙️",
    className: "eoc-btn eoc-btn--outline",
  },
] as const;

export default function Home() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <h1
        style={{
          fontSize: "2.4rem",
          fontWeight: 800,
          textAlign: "center",
          margin: "1rem 0 0.25rem",
        }}
      >
        외출 도우미
      </h1>
      <p style={{ textAlign: "center", color: "#475569", marginBottom: "2rem" }}>
        가고 싶은 곳을 눌러 보세요
      </p>

      <TodayPlanCard />

      <nav style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.className}
            style={{ flexDirection: "column", gap: "0.25rem", minHeight: 110 }}
          >
            <span style={{ fontSize: "2rem", lineHeight: 1 }}>
              {item.icon} {item.label}
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 500, opacity: 0.92 }}>
              {item.sub}
            </span>
          </Link>
        ))}
      </nav>

      <SafetyBar />
    </main>
  );
}
