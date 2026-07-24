import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/components/commerce/commerce.css";
import { Providers } from "./providers";
import { Header } from "@/components/commerce/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commerce",
  description: "Loopers 커머스 — 서버·URL·클라이언트 상태의 경계를 직접 정합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Header는 layout에 두어 페이지 이동 중에도 store 개수가 유지되는 걸 보인다. */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
