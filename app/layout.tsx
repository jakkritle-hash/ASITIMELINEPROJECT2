import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";

// IBM Plex Sans Thai — เอกลักษณ์เชิงบรรณาธิการ/เทคนิค + รองรับไทยเต็มรูปแบบ (แทน Arial ที่ render ไทยแย่)
const sans = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// IBM Plex Mono — ใช้กับตัวเลข/เมตริก ให้ความรู้สึกแม่นยำแบบหน้าปัดเครื่องมือ
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASI Project Tracker",
  description: "Dashboard ติดตามงานของทีม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NavBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
