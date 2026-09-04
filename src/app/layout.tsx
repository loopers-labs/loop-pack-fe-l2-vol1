import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/_app/styles/globals.css";
import "@/_app/styles/commerce.css";
import { Providers } from "@/_app/providers";
import { metadataOrigin } from "@/shared/config";

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
  // prerender 시점에도 평가되므로 기본값이 필요하다. self-HTTP와 위험도가 다른 이유는
  // shared/config/appOrigin.ts에 적었다.
  metadataBase: new URL(metadataOrigin()),
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
        {/* Header는 (shop) 그룹 layout으로 내렸다 — 세션을 읽으려면 쿠키가 필요하고,
            그걸 루트에 두면 측정용 랩 페이지까지 동적이 된다. 근거는 그 파일에 적었다.
            Providers는 여기 남는다. 모든 라우트가 QueryClient를 쓴다. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
