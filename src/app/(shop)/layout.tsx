import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getQueryClient } from "@/_app/getQueryClient";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { SESSION_QUERY_KEY, sessionFromCookie } from "@/entities/session";
import { Header } from "@/widgets/header";

// ── 왜 라우트 그룹인가 ──────────────────────────────────────────────────────
// 로그인 상태를 초기 HTML에 담으려면 서버가 쿠키를 읽어야 하고, 쿠키를 읽는
// 레이아웃을 쓰는 라우트는 전부 동적이 된다. 루트 layout에 두면 `/_not-found`와
// `/performance-lab/inp`까지 딸려 들어가 7주차의 정적 생성 기준선이 깨진다.
//
// 그래서 헤더와 세션을 이 그룹으로 내렸다. 커머스 화면(`/` · `/products` ·
// `/login` · `/checkout` · `/orders`)은 어차피 force-dynamic이라 잃는 것이 없고,
// 측정용 랩 페이지는 루트 layout만 쓰므로 Static으로 남는다.
//
// ── 왜 self-HTTP가 아닌가 ───────────────────────────────────────────────────
// 이 앱은 서버에서도 자기 Route Handler를 HTTP로 부른다(shared/config/appOrigin.ts).
// 세션만 예외로 둔다. 서버 fetch는 들어온 요청의 쿠키를 자동으로 싣지 않아서
// `/api/auth/me`를 부르려면 Cookie 헤더를 손으로 옮겨야 하는데, 그건 인증 정보를
// 한 번 더 복사하는 일이다. 검증 함수가 같은 프로세스에 있으므로 직접 읽는다.
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // ── 쿠키를 들고 왔는데 서버가 인정하지 않으면 만료다 ────────────────────
  // 처음엔 `user === null`을 전부 anonymous로 접었는데, 그러면 **실제 TTL 만료가
  // 만료로 보이지 않는다.** 만료 쿠키로 /orders에 들어오면 proxy는 쿠키가 있어
  // 통과시키고, 여기서 anonymous를 주입하면 이후 /api/orders의 401이 와도
  // sessionExpiry가 전이를 못 본다(직전 상태가 authenticated가 아니므로).
  // 실측: 만료 토큰으로 요청하니 초기 HTML이 ">로그인<"이었고 "세션이
  // 만료되었습니다"가 뜨지 않았다(Codex 교차 검증에서 나온 자리다).
  //
  // 쿠키를 들고 온 것 자체가 "이 브라우저는 로그인했다고 믿는다"는 뜻이다.
  // 그런데 서버가 인정하지 않았다 — 그게 만료(또는 위조)의 정의다.
  //
  // 4단계의 `expired` 시나리오는 이 경로를 타지 않는다. 노브는 서명이 유효한
  // 쿠키를 그대로 두고 API만 401로 만들기 때문에 여기서는 authenticated가 되고,
  // 만료 판정이 클라이언트 쪽 전이에서 일어난다. 두 경로가 다르다.
  const cookie = (await cookies()).get(SESSION_COOKIE);
  const user = readSessionToken(cookie?.value);
  const session = sessionFromCookie(cookie !== undefined, user);

  // 조회가 아니라 주입이다. 서버가 이미 답을 아는 값을 다시 물을 이유가 없고,
  // 브라우저의 첫 렌더가 같은 값을 보게 해야 hydration이 어긋나지 않는다.
  queryClient.setQueryData(SESSION_QUERY_KEY, session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header />
      {children}
    </HydrationBoundary>
  );
}
