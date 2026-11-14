import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Rubik } from "next/font/google";
import { cn } from "@/lib/utils";

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={cn("font-sans", rubik.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily:
            'var(--font-sans), Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        className="min-h-screen bg-[#F5F3E9] text-[#28301C] antialiased selection:bg-[#41644A] selection:text-[#FFFFFF]"
      >
        {children}
      </body>
    </html>
  );
}
