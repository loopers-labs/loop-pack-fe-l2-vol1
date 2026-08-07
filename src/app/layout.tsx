import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/_app/styles/globals.css";
import { Providers } from "@/_app/providers";
import { SITE_URL } from "@/shared/api";
import { SITE_NAME, SITE_DESCRIPTION, baseOpenGraph } from "@/shared/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 상대 image·url 을 절대 URL 로 바꾸는 기준. 서버 fetch base 와 같은 origin(APP_ORIGIN)을 쓴다.
  metadataBase: new URL(SITE_URL),
  // 자식 페이지 title 은 "%s | Commerce" 로 합성, 미지정 시 default 사용.
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...baseOpenGraph,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
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
