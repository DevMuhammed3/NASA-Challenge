import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GAIA | Real Environmental Intelligence & NASA Telemetry MVP",
  description:
    "GAIA MVP — Adapting Farms with NASA Data (NASA POWER Daily Point API, NASA GIBS WMTS Imagery, Gemini AI Advisor)",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily:
            'Cairo, "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        className="min-h-screen bg-[#28301C] text-[#D2CF9A] antialiased selection:bg-[#9A7E3B] selection:text-[#28301C]"
      >
        {children}
      </body>
    </html>
  );
}
