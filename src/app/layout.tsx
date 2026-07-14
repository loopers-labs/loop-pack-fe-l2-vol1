import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/*
 * 가변 폰트 파일 하나가 45~920 굵기를 전부 커버한다 (pretendard 패키지의
 * dist/web/variable/woff2/PretendardVariable.woff2를 self-host).
 * next/font/local이 서브셋/프리로드/폴백 메트릭을 자동으로 최적화해준다.
 */
const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  )
}
