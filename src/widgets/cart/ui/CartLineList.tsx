"use client";

import { useQuery } from "@tanstack/react-query";
import { useCartIds, useCartHasHydrated } from "@/entities/cart";
import { productQueries } from "@/entities/product";
import { formatPrice } from "@/shared/lib/formatPrice";
import layout from "@/shared/ui/layout.module.css";
import styles from "./CartLineList.module.css";

// 카트에 담긴 상품을 이름·가격으로 보여준다. /cart 와 주문서(/orders/new)가 함께 쓴다.
// 담긴 id 는 클라이언트 store, 상품명은 카탈로그 쿼리에서 온다 — 아직 안 온 이름은 id 로 대체한다.
export function CartLineList() {
  const ids = useCartIds();
  const hasHydrated = useCartHasHydrated();
  const { data } = useQuery(productQueries.catalog());

  if (!hasHydrated) {
    return <p className={layout.status}>불러오는 중…</p>;
  }

  if (ids.size === 0) {
    return <p className={layout.status}>장바구니가 비어 있습니다.</p>;
  }

  const productById = new Map(
    (data?.products ?? []).map((product) => [product.id, product]),
  );

  return (
    <ul className={styles.lines}>
      {[...ids].map((id) => {
        const product = productById.get(id);

        return (
          <li key={id} className={styles.line}>
            <span>{product?.name ?? id}</span>
            {product && (
              <span className={styles.price}>{formatPrice(product.price)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
