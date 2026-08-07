import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { QueryProvider } from '@/shared/api/QueryProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_NAME = 'Commerce';
// [AI] OG image 등 상대 경로를 절대 URL로 변환하는 기준. fetcher의 getBaseUrl과 동일 출처.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// [AI] 공통 Open Graph. Next는 페이지 openGraph를 root 것과 얕게 병합(통째로 교체)하므로,
// 페이지에서 ...commonOpenGraph로 펼쳐 siteName/locale/type이 날아가지 않게 한다.
// week-07 3단계 요구사항: shallow merge에도 공통 필드(siteName/locale/type) 유지.
export const commonOpenGraph = {
  siteName: SITE_NAME,
  locale: 'ko_KR',
  type: 'website' as const,
};

// [AI] OG 기본 이미지. 상품이 없는 페이지 등에서 fallback으로 쓴다 (홈 배너 이미지와 동일).
export const DEFAULT_OG_IMAGE = '/images/products/p6.jpg';

export const metadata: Metadata = {
  // [AI] 페이지에서 상대 경로 image를 줘도 절대 URL로 렌더되게 하는 기준점.
  metadataBase: new URL(SITE_URL),
  // [AI] title template: 페이지가 title을 주면 "%s | Commerce"로 합성,
  // 안 주면 default 'Commerce' 사용. 메타데이터 경로 확인(line 136) 대응.
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
  openGraph: {
    ...commonOpenGraph,
    title: SITE_NAME,
    description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <NuqsAdapter>
          <QueryProvider>{children}</QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
};

export default RootLayout;
