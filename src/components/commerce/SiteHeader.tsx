import Link from "next/link";

type SiteHeaderProps = {
  wishlistCount: number;
  cartCount: number;
};

export function SiteHeader({ wishlistCount, cartCount }: SiteHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-6 max-[480px]:items-start">
      <Link href="/">Commerce</Link>
      <nav className="flex flex-wrap items-center gap-3 max-[480px]:w-full" aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
}
