import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/_app/styles/globals.css";
import "@/_app/styles/commerce.css";
import { Providers } from "@/_app/providers";
import { Header } from "@/widgets/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Commerce";
const SITE_DESCRIPTION = "Loopers 커머스 — 서버·URL·클라이언트 상태의 경계를 직접 정합니다.";

// 페이지 openGraph는 루트 openGraph를 통째로 덮는다(shallow merge).
// 그래서 공통 필드를 객체로 내보내고 각 페이지가 명시적으로 펼쳐 쓴다.
export const commonOpenGraph = {
  siteName: SITE_NAME,
  locale: "ko_KR",
  type: "website",
  images: [{ url: "/images/week-07/hero-original.jpg", width: 3840, height: 2160 }],
} satisfies Metadata["openGraph"];

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? `http://localhost:${process.env.PORT ?? "3000"}`),
  // 페이지가 title만 주면 "<페이지> · Commerce"로 합성된다.
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { ...commonOpenGraph, title: SITE_NAME, description: SITE_DESCRIPTION },
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
