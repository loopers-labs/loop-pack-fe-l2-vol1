import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from './_lib/session';
import { Providers } from './providers';
import { HeaderNav } from './_components/HeaderNav';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? 'http://localhost:3000'),
  title: {
    default: 'Aesthetic | 매일 새롭게 발견하는 취향',
    template: '%s | Aesthetic',
  },
  description: '나다운 일상을 완성하는 라이프스타일 셀렉트숍. 패션, 뷰티, 홈데코, 디지털까지 — 취향을 발견하고, 공간에 감각을 더하세요.',
  openGraph: {
    title: 'Aesthetic | 매일 새롭게 발견하는 취향',
    description: '나다운 일상을 완성하는 라이프스타일 셀렉트숍. 취향을 발견하고, 공간에 감각을 더하세요.',
    siteName: 'Aesthetic',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aesthetic | 매일 새롭게 발견하는 취향',
    description: '나다운 일상을 완성하는 라이프스타일 셀렉트숍. 취향을 발견하고, 공간에 감각을 더하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <head>
        <link
          rel="preload"
          as="font"
          href="/fonts/pretendard/PretendardVariable.subset.91.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="image"
          imageSrcSet="/images/week-07/hero-640.avif 640w, /images/week-07/hero-1080.avif 1080w, /images/week-07/hero-1920.avif 1920w"
          imageSizes="(max-width: 1280px) 100vw, 1280px"
          type="image/avif"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-bg font-family-body antialiased">
        <Providers>
          {/* 공통 헤더 */}
          <header className="border-b border-border bg-bg-card">
            <div className="mx-auto flex min-h-20 w-full max-w-[1256px] items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="rounded-sm font-family-display text-2xl font-extrabold tracking-[-0.04em] text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
              >
                Aesthetic
              </Link>
              <HeaderNav user={user} />
            </div>
          </header>

          {/* 페이지 콘텐츠 */}
          <div className="mx-auto w-full max-w-[1256px] flex-1">{children}</div>

          {/* 공통 푸터 */}
          <footer className="border-t border-border bg-bg-card">
            <div className="mx-auto w-full max-w-[1256px] px-4 py-10 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center gap-2">
                <span className="font-family-display text-lg font-extrabold tracking-[-0.03em] text-text">
                  Aesthetic
                </span>
                <p className="text-[12px] text-text-caption">
                  Curated with care, delivered with love.
                </p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
