import Link from 'next/link'
import HeaderCounts from './HeaderCounts'
import ThemeSelect from './ThemeSelect'

// 헤더 자체는 서버 컴포넌트로 두고, store 구독은 개수 배지 leaf에만 허용한다.
export default function Header() {
  return (
    <header className="week05-header">
      <Link className="week05-brand" href="/">
        Loop Market
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/products">Shop</Link>
        <Link href="/playground">Components</Link>
        <HeaderCounts />
        <ThemeSelect />
      </nav>
    </header>
  )
}
