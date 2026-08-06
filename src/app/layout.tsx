import { COMMON_OPEN_GRAPH, SITE_DESCRIPTION, SITE_NAME, toOpenGraphImages } from '@/shared/config/siteMetadata';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * 모든 페이지가 물려받는 기본 metadata.
 *
 * title.template: 페이지가 title 문자열만 주면 " · Commerce" 가 뒤에 붙는다.
 *   페이지가 title 을 아예 주지 않으면 default 가 쓰인다.
 * metadataBase: openGraph.images 에 상대 경로를 써도 절대 URL 로 바뀐다.
 *   build 와 runtime 에 같은 APP_ORIGIN 을 넣어야 공유 링크의 이미지 주소가 어긋나지 않는다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? 'http://localhost:3000'),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...COMMON_OPEN_GRAPH,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: toOpenGraphImages(undefined, `${SITE_NAME} 배너`),
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
