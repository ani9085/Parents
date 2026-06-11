import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so Capacitor can bundle the app as offline assets in the APK.
  output: "export",
  // No Next.js image optimization server in a static/native bundle.
  images: { unoptimized: true },
  // Emit folder/index.html routes so file:// resolution works in the WebView.
  trailingSlash: true,
};

export default nextConfig;
