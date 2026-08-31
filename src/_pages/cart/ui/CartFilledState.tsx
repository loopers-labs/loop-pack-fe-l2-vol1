'use client';

import Link from 'next/link';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { formatWon } from '@/shared/lib/format';
import { useCartProducts } from '../lib/useCartProducts';
import type { CartItem } from '@/entities/cart/model/cartStore';

interface CartFilledStateProps {
  items: CartItem[];
}

export function CartFilledState({ items }: CartFilledStateProps) {
  const removeItem = useCartStore((state) => state.removeItem);
  const { products, isPending, isError, refetch } = useCartProducts(
    items.map((item) => item.id),
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const product = products.get(item.id);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-caption">
          Cart
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-text sm:text-4xl">
          장바구니
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          총 {itemCount}개의 상품이 담겨 있습니다.
        </p>
      </div>

      <div className="mt-10 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <section
          aria-labelledby="cart-items-title"
          className="rounded-2xl border border-border bg-bg-card p-5 sm:p-8"
        >
          <h2 id="cart-items-title" className="text-xl font-bold text-text">
            담은 상품
          </h2>

          <ul className="mt-5 divide-y divide-border/60">
            {items.map((item) => {
              const product = products.get(item.id);

              return (
                <li key={item.id} className="flex gap-4 py-5 first:pt-0">
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {product ? (
                      <img
                        src={product.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full animate-pulse bg-border/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {product ? (
                      <>
                        <p className="text-xs font-medium text-text-caption">
                          {product.brand}
                        </p>
                        <Link
                          href={`/products/${product.id}`}
                          className="mt-1 line-clamp-2 rounded-sm text-sm leading-5 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-2 text-sm font-semibold text-text">
                          {formatWon(product.price)} × {item.quantity}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-text-secondary">
                        상품 정보를 불러오는 중입니다.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${product?.name ?? item.id} 장바구니에서 삭제`}
                      className="mt-2 min-h-11 text-xs font-semibold text-text-caption underline underline-offset-4 transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {isError && (
            <div role="alert" className="mt-5 text-sm text-text-secondary">
              <p>일부 상품 정보를 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 min-h-11 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
              >
                다시 불러오기
              </button>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-bg-card p-6 md:sticky md:top-6">
          <h2 className="text-lg font-bold text-text">결제 예정 금액</h2>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
            <span className="text-sm text-text-secondary">총 {itemCount}개</span>
            <strong className="text-xl font-bold text-text">
              {isPending ? '계산 중…' : formatWon(total)}
            </strong>
          </div>
          <Link
            href="/orders/new"
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-lg bg-text px-5 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            주문하기
          </Link>
          <Link
            href="/products"
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-text-secondary transition-colors hover:border-neutral-400 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            쇼핑 계속하기
          </Link>
        </aside>
      </div>
    </main>
  );
}
