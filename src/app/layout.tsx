import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import { Header } from '@/widgets/header/ui/Header'

import { Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
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
