import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { SITE_DESCRIPTION, SITE_NAME, sharedOpenGraph, withSiteName } from "@/shared/config/seo";
import "./globals.css";
import "./week-05-layout.css";
import "./week-09-auth.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  title: {
    template: withSiteName("%s"),
    default: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...sharedOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

// 루트 layout 은 요청 정보를 읽지 않는다. 세션은 (commerce)/layout.tsx 가 읽어, 동적 렌더 범위를 그 그룹 안으로 줄인다
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
