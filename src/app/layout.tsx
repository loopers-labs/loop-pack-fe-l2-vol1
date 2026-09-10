import type { Metadata } from 'next'
import Providers from './providers'
import { getAppOrigin } from '@/shared/config/appOrigin'
import { sharedOpenGraph } from '@/shared/config/metadata'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'
import './commerce.css'

// 이 layout 은 세션을 읽지 않는다. 여기서 쿠키를 읽으면 모든 라우트가 동적 렌더가 되고,
// 세션과 무관한 데모 라우트((lab) 그룹)까지 정적 생성에서 빠진다.
// 로그인 상태가 필요한 화면은 (storefront) 그룹의 layout 이 읽는다.

// 페이지가 자기 title을 정하면 template이 감싸고, 정하지 않으면 default를 쓴다.
// description은 페이지가 덮기 전까지 쓰는 공통 fallback이라 지금 문구를 유지한다.
export const metadata: Metadata = {
  // 상대 경로 이미지를 절대 URL로 해석하는 기준이다. 없으면 Next가 localhost를 써서
  // 실행 환경과 무관한 주소가 결과물에 굳는다.
  metadataBase: new URL(getAppOrigin()),
  title: {
    default: 'Loop Market',
    template: '%s | Loop Market',
  },
  description: 'A curated commerce experience by Loopers.',
  openGraph: sharedOpenGraph,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" data-theme="light">
      <body>
        <Providers>
          <div className="week05-page">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
