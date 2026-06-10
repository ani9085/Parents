import Link from "next/link";

/**
 * Standard page header for inner screens: a big "home" back button and a large
 * title. Keeps navigation predictable for seniors — the way back is always in
 * the same place and is impossible to miss.
 */
export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="mb-6">
      <Link
        href="/"
        className="eoc-btn eoc-btn--outline"
        style={{ minHeight: 72, fontSize: "1.4rem", marginBottom: "1rem" }}
        aria-label="첫 화면으로 돌아가기"
      >
        ← 첫 화면
      </Link>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.2 }}>{title}</h1>
    </header>
  );
}
