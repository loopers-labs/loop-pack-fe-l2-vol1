import type { Metadata } from 'next'
import Providers from './providers'
import { Header } from '@/widgets/header'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'
import './commerce.css'

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'A curated commerce experience by Loopers.',
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
