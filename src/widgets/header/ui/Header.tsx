import Link from 'next/link'
import HeaderCounts from './HeaderCounts'
import SessionArea from './SessionArea'
import ThemeSelect from './ThemeSelect'
import type { SessionState } from '@/entities/session/model/session'

// 헤더 자체는 서버 컴포넌트로 두고, store 구독은 개수 배지 leaf에만 허용한다.
//
// session 을 받지 않은 화면에서는 인증 영역을 그리지 않는다. undefined 는
// "이 화면은 세션을 읽지 않았다"는 뜻이고, null 이 미로그인이다. 둘을 같게 다루면
// 세션을 모르는 정적 화면이 로그인한 사용자에게 "로그인" 링크를 보여준다.
export default function Header({ session }: { session?: SessionState }) {
  return (
    <header className="week05-header">
      <Link className="week05-brand" href="/">
        Loop Market
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/products">Shop</Link>
        <Link href="/playground">Components</Link>
        <HeaderCounts />
        {session !== undefined && <SessionArea user={session} />}
        <ThemeSelect />
      </nav>
    </header>
  )
}
