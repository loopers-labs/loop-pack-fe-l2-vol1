import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/_app/providers/Providers";
import {
  commerceDescription,
  commerceOpenGraph,
  commerceOpenGraphFallbackImage,
  commerceSiteName,
  getAppOrigin,
} from "@/shared/metadata/commerceMetadata";
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
  metadataBase: new URL(getAppOrigin()),
  title: {
    default: commerceSiteName,
    template: `%s | ${commerceSiteName}`,
  },
  description: commerceDescription,
  openGraph: {
    ...commerceOpenGraph,
    title: commerceSiteName,
    description: commerceDescription,
    images: [commerceOpenGraphFallbackImage],
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
