'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatPrice } from '@/shared/lib/formatPrice';
import { useCartStore } from '@/entities/cart';
import { productCatalogQueries } from '@/entities/product';

export default function CartSection() {
  const cartItems = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeFromCart = useCartStore((state) => state.remove);
  const { data: catalog } = useSuspenseQuery(productCatalogQueries.lookup());

  const lines = [...cartItems].map(([productId, quantity]) => {
    const product = catalog[productId];
    return { productId, product, quantity, subtotal: product ? product.price * quantity : null };
  });

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = lines.reduce((sum, line) => sum + (line.subtotal ?? 0), 0);
  const hasUnknownProduct = lines.some((line) => line.subtotal === null);

  return (
    <>
      <section className="content-section">
        <h2 className="visually-hidden">담은 상품</h2>
        <ul className="order-line-list order-line-list-boxed">
          {lines.map(({ productId, product, quantity, subtotal }) => (
            <li className="order-line" key={productId}>
              {product ? <Image className="order-line-image" src={product.image} alt={product.name} width={160} height={160} /> : <span className="order-line-image" aria-hidden="true" />}
              <div className="order-line-body">
                <p className="order-line-name">{product ? product.name : productId}</p>
                <p className="order-line-meta">
                  {product ? formatPrice(product.price) : '상품 정보 없음'}
                  <span aria-hidden="true"> · </span>
                  <input
                    className="cart-quantity"
                    // 화면에는 "개"만 붙어 있어 입력칸이 여러 개면 서로 구분되지 않는다.
                    aria-label={`${product ? product.name : productId} 수량`}
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    // 1 미만·비정수는 store가 거른다. 걸러지면 값이 바뀌지 않아 입력칸이 직전 값으로 돌아간다.
                    onChange={(event) => setQuantity(productId, Number(event.target.value))}
                  />
                  개
                </p>
              </div>
              <div className="order-line-trailing">
                <strong className="order-line-subtotal">
                  {subtotal === null ? (
                    '—'
                  ) : (
                    <>
                      <span className="visually-hidden">소계 </span>
                      {formatPrice(subtotal)}
                    </>
                  )}
                </strong>
                <button className="order-line-remove" type="button" aria-label={`${product ? product.name : productId} 장바구니에서 빼기`} onClick={() => removeFromCart(productId)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="content-section">
        <h2 className="visually-hidden">결제 예상 금액</h2>
        {/* 수량을 바꾸면 이 값이 바뀐다. 변화가 알려지지 않으면 조작 결과를 알 수 없다.
            polite인 이유는 입력 도중 끼어들지 않게 하기 위함이다. */}
        <p className="order-total" aria-live="polite">
          <span>상품 {totalQuantity}개</span>
          <strong>
            {formatPrice(totalPrice)}
            {hasUnknownProduct && <span className="order-card-note"> (상품 정보를 불러오지 못한 항목 제외)</span>}
          </strong>
        </p>

        <div className="order-submit">
          {/* prefetch=false: 안 끄면 로그인 후에도 캐시된 리다이렉트 때문에 /login에 머문다 (vercel/next.js#88937, 미해결) */}
          <Link className="primary-action" href="/orders/new" prefetch={false}>
            주문하기
          </Link>
        </div>
      </section>
    </>
  );
}
