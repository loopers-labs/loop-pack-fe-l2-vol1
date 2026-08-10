import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/_app/providers/Providers'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'
import {
  OG_FALLBACK_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  sharedOpenGraph,
} from '@/shared/config/site'
import '@/_app/styles/globals.css'

/*
 * 가변 폰트 파일 하나가 45~920 굵기를 전부 커버한다 (pretendard 패키지의
 * dist/web/variable/woff2/PretendardVariable.woff2를 self-host).
 * next/font/local이 서브셋/프리로드/폴백 메트릭을 자동으로 최적화해준다.
 */
const pretendard = localFont({
  src: '../src/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})

export const metadata: Metadata = {
  // og:image 등 상대경로 URL을 절대화하는 기준. metadata는 서버에서만 평가되므로
  // getApiBaseUrl()은 여기서 항상 origin을 반환한다.
  metadataBase: new URL(getApiBaseUrl()),
  // default는 페이지가 title을 주지 않을 때, template은 페이지 title을 감쌀 때 쓰인다.
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...sharedOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_FALLBACK_IMAGE],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
