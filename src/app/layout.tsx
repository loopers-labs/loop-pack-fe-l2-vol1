import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "@/app/_lib/session";
import { Providers } from "@/app/providers";
import { SessionBoundary } from "@/features/auth";
import { SITE_DESCRIPTION, SITE_NAME, sharedOpenGraph, withSiteName } from "@/shared/config/seo";
import { HeaderActions, HeaderAuth } from "@/widgets/header";
import "./globals.css";
import "./week-05-layout.css";
import "./week-09-auth.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  title: {
    template: withSiteName("%s"),
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...sharedOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

// 헤더가 모든 화면에 있으므로 세션은 여기서 한 번 읽어 초기 HTML 에 반영한다.
// 대가: cookies() 를 읽는 순간 모든 라우트가 요청 시 렌더가 된다. 7주차에 측정한 `/`·`/products` 는
// 이미 동적이었고, 정적이던 것은 데모 페이지 3개뿐이라 받아들였다
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSession();

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <SessionBoundary />
          <div className="week05-page">
            <header className="week05-header">
              <Link href="/">Commerce</Link>
              <nav aria-label="주요 메뉴">
                <Link href="/products">상품</Link>
                <HeaderActions />
                <HeaderAuth initialUser={user} />
              </nav>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
