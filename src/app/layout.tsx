import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { HeaderActions } from "@/widgets/header";
import "./globals.css";
import "./week-05-layout.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commerce",
  description: "Loopers 커머스 - 4주차부터 여기에 쌓아갑니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>
          <div className="week05-page">
            <header className="week05-header">
              <Link href="/">Commerce</Link>
              <nav aria-label="주요 메뉴">
                <Link href="/products">상품</Link>
                <HeaderActions />
              </nav>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
