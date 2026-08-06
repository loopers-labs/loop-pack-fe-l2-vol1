import type { Metadata } from 'next';
import Link from 'next/link';
import { Providers } from './providers';
import { HeaderNav } from './_components/HeaderNav';
import './globals.css';

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          href="/images/week-07/hero-640.avif"
          type="image/avif"
          media="(max-width: 640px)"
        />
        <link
          rel="preload"
          as="image"
          href="/images/week-07/hero-1080.avif"
          type="image/avif"
          media="(min-width: 641px)"
        />
      </head>
      <body className="font-family-body antialiased min-h-screen bg-bg flex flex-col">
        <Providers>
          {/* 공통 헤더 */}
          <header className="border-b border-border/60 bg-bg-card">
            <div className="mx-auto flex max-w-screen-xl items-center justify-between px-8 py-6">
              <Link
                href="/"
                className="font-family-display text-2xl font-bold tracking-tight text-text"
              >
                Aesthetic
              </Link>
              <HeaderNav />
            </div>
          </header>

          {/* 페이지 콘텐츠 */}
          <div className="mx-auto max-w-screen-xl flex-1">{children}</div>

          {/* 공통 푸터 */}
          <footer className="border-t border-border/60 bg-bg-card">
            <div className="mx-auto max-w-screen-xl px-8 py-10">
              <div className="flex flex-col items-center gap-2">
                <span className="font-family-display text-lg font-bold text-text">
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
