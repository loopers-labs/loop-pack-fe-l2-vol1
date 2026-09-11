import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@/examples/week-05-layout/week-05-layout.css';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AnalyticsProvider } from './AnalyticsProvider';
import { QueryProvider } from './providers';
import {
  APP_ORIGIN,
  FALLBACK_OG_IMAGE,
  sharedOpenGraph,
} from './shared-metadata';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 루트 공통 metadata — 페이지 metadata 조회가 실패하면 이 값이 그대로 상속된다.
export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  title: { default: 'Commerce', template: '%s | Commerce' },
  description: '매일 새롭게 발견하는 취향 — Loopers 커머스',
  openGraph: {
    ...sharedOpenGraph,
    title: 'Commerce',
    description: '매일 새롭게 발견하는 취향 — Loopers 커머스',
    images: [FALLBACK_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <NuqsAdapter>
          <QueryProvider>{children}</QueryProvider>
          <AnalyticsProvider />
        </NuqsAdapter>
      </body>
    </html>
  );
}
