import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './home.css';

import Providers from './providers';

import { getAppOrigin } from '@/shared/app-origin';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * %s로 페이지별 변하는 값에 따라 그려지도록 하고 공통 서비스 이름을 반복하지 않게 함.
 * openGraph는 shallow merge라 페이지가 이 키를 주면 아래 객체가 통째로 교체된다.
 * siteName·locale·type은 사라지므로 페이지마다 다시 적는다.
 */
export const metadata: Metadata = {
  metadataBase: getAppOrigin(),
  title: {
    default: '루프몰 | LOOP MALL',
    template: '%s | LOOP MALL',
  },
  description: '매주 새로 고른 인테리어 상품을 소개합니다.',
  openGraph: {
    siteName: 'LOOP MALL',
    locale: 'ko_KR',
    type: 'website',
    title: '루프몰 | LOOP MALL',
    description: '매주 새로 고른 인테리어 상품을 소개합니다.',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
