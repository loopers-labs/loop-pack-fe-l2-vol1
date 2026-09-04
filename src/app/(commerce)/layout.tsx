import { cookies } from "next/headers";

import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { SessionProvider } from "@/entities/session/ui/SessionProvider";
import { AnalyticsSessionSync } from "@/features/analytics/ui/AnalyticsSessionSync";
import { Header } from "@/widgets/header/ui/Header";

import "@/shared/ui/week-05-layout.css";

// 커머스 route group 공통 레이아웃. 헤더를 한 번만 렌더해 라우트 전환에도 유지한다.
// `(commerce)` 그룹이라 URL에 영향이 없고, 그룹 밖 /demo에는 헤더가 붙지 않는다.
// `.week05-page`를 여기에 두어 Header와 페이지 본문이 같은 스코프에 들어가고,
// 그 안의 focus-visible 스타일이 헤더·필터 모두에 적용된다.
//
// 서버에서 세션 쿠키를 판독(서명·TTL 검증)해 로그인 상태를 트리에 내린다 — 요청 시점 단일 진실.
// 쿠키를 읽어 이 레이아웃은 동적이 되지만, 홈·상품은 이미 동적이라 새로 잃는 정적성은 없다.
export default async function CommerceLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = readSessionToken(token);

  return (
    <main className="week05-page">
      <SessionProvider user={user}>
        {/* 로그인 상태를 계측에 잇는다(userId identify/reset). SessionProvider 안이라 useSession을 읽는다. */}
        <AnalyticsSessionSync />
        <Header />
        {children}
      </SessionProvider>
    </main>
  );
}
