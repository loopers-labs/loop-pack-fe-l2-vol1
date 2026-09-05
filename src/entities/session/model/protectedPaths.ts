// 로그인을 요구하는 경로다. 가드(proxy)와 화면이 같은 목록을 봐야 한 쪽만 막히는
// 구멍이 생기지 않는다.
//
// 주문서와 주문 내역만 넣는다. 장바구니와 위시리스트는 서버 원본이 없는 익명 상태이고,
// 담는 도중 로그인 화면으로 보내면 이탈이 늘어난다. 로그인은 주문 시작 시점에 요구한다.
export const PROTECTED_PREFIXES = ['/orders'] as const

// 접두사만 비교하면 '/ordersomething' 같은 무관한 경로까지 막힌다. 경계 문자를 함께 본다.
export const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
