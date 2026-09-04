import { cookies } from 'next/headers'
import { getSession } from '@/entities/session'
import { HeaderNav } from '@/widgets/header/HeaderNav'

// 세션을 서버에서 읽어 초기 HTML에 로그인 상태를 담는다(docs/week-09/decisions.md 6번).
// Suspense로 흘려보내지 않는다 — 명세가 "JS 실행 전에도 로그인 여부가 보인다"를 요구해서,
// 스트리밍하면 헤더가 나중에 붙어 그 요구와 부딪힌다.
// 대신 이 헤더를 쓰는 모든 화면의 서버 렌더가 /api/auth/me의 500ms만큼 밀린다.
// 감수하기로 한 비용이다. 측정 결과 h1 도착이 약 42ms에서 약 558ms로 밀렸다
// (docs/week-09/decisions.md "7주차 지표 재측정" 절).
//
// async 경계를 이 컴포넌트로 좁혀 쓰는 쪽 페이지는 async가 되지 않지만,
// 이것이 h1을 세션 대기에서 지켜주지는 않는다. Suspense 경계가 없으면
// 스트리밍은 문서 순서대로 나가므로, Header가 h1보다 앞에 있는 한
// 첫 flush 자체가 세션을 기다린다. 좁힌 것은 페이지 컴포넌트의
// 시그니처였을 뿐 flush 시점이 아니다.
//
// cookies()를 여기서 읽는 것은 entities/session이 클라이언트 번들에도 들어가는 모듈이라
// next/headers를 품을 수 없기 때문이다. 쿠키를 읽는 일은 서버 호출자가 한다.
// cookies()를 부르면 이 헤더를 쓰는 라우트가 동적이 된다.
export const Header = async () => {
  const cookieHeader = (await cookies()).toString()
  const user = await getSession(cookieHeader)

  return <HeaderNav user={user} />
}
