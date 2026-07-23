import Link from 'next/link'
import HeaderCounts from '@/components/commerce/HeaderCounts'

// 헤더 자체는 서버 컴포넌트로 두고, store 구독은 개수 배지 leaf에만 허용한다.
export default function Header() {
  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <Link href="/playground">컴포넌트 데모</Link>
        <HeaderCounts />
      </nav>
    </header>
  )
}
