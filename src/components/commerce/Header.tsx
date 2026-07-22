import Link from 'next/link'

export default function Header() {
  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <Link href="/playground">컴포넌트 데모</Link>
      </nav>
    </header>
  )
}
