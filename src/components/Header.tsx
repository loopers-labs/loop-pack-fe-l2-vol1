import Link from 'next/link';

export function Header() {
  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 0</span>
        <span>장바구니 0</span>
      </nav>
    </header>
  );
}
