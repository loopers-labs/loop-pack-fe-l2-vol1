import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from './providers';
import { SITE_OPENGRAPH } from '@/shared/config/site-metadata';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Commerce',
    default: 'Commerce',
  },
  description: 'Loopers 커머스',
  openGraph: SITE_OPENGRAPH,
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
