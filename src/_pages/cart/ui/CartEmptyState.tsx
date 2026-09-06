import Link from 'next/link';

export function CartEmptyState() {
  return (
    <section
      aria-labelledby="empty-cart-title"
      className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6"
    >
      <div className="w-full border-y border-border bg-bg-card px-6 py-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
          Cart
        </p>
        <h1
          id="empty-cart-title"
          className="mt-3 text-3xl font-bold tracking-[-0.04em] text-text sm:text-4xl"
        >
          장바구니에 담긴 상품이 없어요.
        </h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">
          원하는 상품을 담아보세요.
        </p>
        <Link
          href="/products"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-text px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          상품 담으러 가기
        </Link>
      </div>
    </section>
  );
}
