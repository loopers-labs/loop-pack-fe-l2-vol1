import type { Metadata } from 'next'
import Providers from './providers'
import { sharedOpenGraph } from '@/shared/config/metadata'
import { Header } from '@/widgets/header'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'
import './commerce.css'

// 페이지가 자기 title을 정하면 template이 감싸고, 정하지 않으면 default를 쓴다.
// description은 페이지가 덮기 전까지 쓰는 공통 fallback이라 지금 문구를 유지한다.
export const metadata: Metadata = {
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
          <div className="week05-page">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
