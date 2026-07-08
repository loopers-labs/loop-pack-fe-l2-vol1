import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-family-body antialiased min-h-screen bg-bg flex flex-col">
        {/* 공통 헤더 */}
        <header className="border-b border-border/60 bg-bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
            <Link
              href="/"
              className="font-family-display text-2xl font-bold tracking-tight text-text"
            >
              Maison
            </Link>
            <nav className="hidden gap-8 text-[14px] font-medium text-text-secondary sm:flex">
              <Link href="/" className="transition-colors hover:text-text">
                New
              </Link>
              <Link href="/" className="transition-colors hover:text-text">
                Collections
              </Link>
              <Link href="/" className="transition-colors hover:text-text">
                About
              </Link>
            </nav>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <div className="flex-1">{children}</div>

        {/* 공통 푸터 */}
        <footer className="border-t border-border/60 bg-bg-card">
          <div className="mx-auto max-w-5xl px-8 py-10">
            <div className="flex flex-col items-center gap-2">
              <span className="font-family-display text-lg font-bold text-text">
                Maison
              </span>
              <p className="text-[12px] text-text-caption">
                Curated with care, delivered with love.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
