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

export const metadata: Metadata = {
  title: 'Commerce',
  description: 'Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.',
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
