import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeApplier from "@/components/ThemeApplier";

export const metadata: Metadata = {
  title: "외출 도우미",
  description: "어르신을 위한 간편한 외출 길찾기 도우미",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow zoom — never trap seniors who pinch to enlarge.
  maximumScale: 5,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
