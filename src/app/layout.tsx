import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Providers from './providers'
import { resolveTheme, THEME_COOKIE_KEY } from '@/shared/lib/theme'
import { Header } from '@/widgets/header'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './globals.css'
import './commerce.css'

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'A curated commerce experience by Loopers.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE_KEY)?.value)

  return (
    <html lang="ko" data-theme={theme}>
      <body>
        <Providers>
          <div className="week05-page">
            <Header initialTheme={theme} />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
