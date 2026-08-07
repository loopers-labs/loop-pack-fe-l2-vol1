import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/_app/styles/globals.css'
import '@/_app/styles/commerce.css'
import { Providers } from '@/_app/providers'
import { APP_ORIGIN } from '@/shared/config/appOrigin'
import { COMMON_OPEN_GRAPH } from '@/shared/config/siteMetadata'
import { Header } from '@/widgets/header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  title: {
    default: 'Loopers 커머스',
    template: '%s | Loopers',
  },
  description: 'Loopers 커머스에서 카테고리별 인기 상품과 신상품을 만나보세요.',
  openGraph: {
    ...COMMON_OPEN_GRAPH,
    title: 'Loopers 커머스',
    description:
      'Loopers 커머스에서 카테고리별 인기 상품과 신상품을 만나보세요.',
  },
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>): JSX.Element {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
