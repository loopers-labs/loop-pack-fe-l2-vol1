import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "@/_app/styles/globals.css";
import { Providers } from "@/_app/providers";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
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

// 세션 쿠키를 여기서 한 번 읽어 로그인 상태를 초기 HTML·context 에 담는다. 전역 소비처(AnalyticsIdentity 등)가
// 트리 최상단에 있어, 헤더보다 위인 여기서 읽어야 서버가 확정한 값이 모두에게 닿는다(→ 클라이언트가 /me 재확인 불필요).
// 트레이드오프: cookies() 를 루트에서 읽으므로 전 라우트가 동적 렌더가 된다(정적 예산 포기).
// readSessionToken(_data) 직접 import 는 /api 왕복 없이 렌더 시점에 검증하는 서버 전용 코드라 proxy·헤더와 같은 예외다.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionUser = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const initialUser = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email }
    : null;

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers initialUser={initialUser}>{children}</Providers>
      </body>
    </html>
  );
}
