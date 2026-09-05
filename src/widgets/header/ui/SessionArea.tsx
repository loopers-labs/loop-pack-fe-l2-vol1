import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { LOGIN_PATH } from '@/entities/session/model/loginRedirect'
import type { SessionUser } from '@/entities/session/model/session'

// 서버가 읽은 세션을 그대로 그린다. 이 영역이 서버 컴포넌트인 이유는, 로그인 여부가
// JavaScript 가 실행되기 전 초기 HTML 에 이미 들어 있어야 하기 때문이다.
// 클라이언트에서 /api/auth/me 를 다시 물어 채우면, 첫 화면에서 로그인한 사용자에게
// 잠깐 "로그인" 링크가 보인다.
export default function SessionArea({ user }: { user: SessionUser | null }) {
  if (user === null) {
    return <Link href={LOGIN_PATH}>로그인</Link>
  }

  return (
    <>
      <Link href="/orders" prefetch={false}>
        주문 내역
      </Link>
      <span data-testid="session-user">{user.name}님</span>
      <LogoutButton />
    </>
  )
}
