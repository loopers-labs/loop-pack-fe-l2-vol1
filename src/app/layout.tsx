import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/app/providers";
import { APP_ORIGIN } from "@/shared/config/appOrigin";
import { COMMON_OPEN_GRAPH } from "@/shared/config/siteMetadata";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  // 페이지가 title만 주면 template이 "제목 | Loopers"로 합성한다. 페이지가 없으면 default를 쓴다.
  title: {
    template: "%s | Loopers",
    default: "Loopers — 인기 상품과 신상품",
  },
  description: "Loopers 커머스에서 카테고리별 인기 상품과 신상품을 한눈에 만나보세요.",
  openGraph: COMMON_OPEN_GRAPH,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
