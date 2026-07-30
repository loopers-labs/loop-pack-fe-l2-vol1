"use client";
import Image from "next/image";
import type { Product } from "@/types/commerce";
import {
  useIsInCart,
  useIsInWishlist,
  useToggleCart,
  useToggleWishlist,
} from "@/features/commerce/store";

const priceFormatter = new Intl.NumberFormat("ko-KR");
const formatPrice = (value: number) => `${priceFormatter.format(value)}원`;

// 각 버튼은 "이 상품의 포함 여부 + 토글 action"만 구독한다.
// 다른 상품이 담겨도 이 카드는 리렌더되지 않는다(selector 경계).
export function ProductCard({ product }: { product: Product }) {
  const inWishlist = useIsInWishlist(product.id);
  const inCart = useIsInCart(product.id);
  const toggleWishlist = useToggleWishlist();
  const toggleCart = useToggleCart();

  return (
    <article className="shop-product">
      <Image
        className="shop-image"
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p className="shop-brand">{product.brand}</p>
      <h3 className="shop-name">{product.name}</h3>
      {product.originalPrice === null ? (
        <p className="shop-price">{formatPrice(product.price)}</p>
      ) : (
        <p className="shop-price">
          <span className="shop-price-sale">{formatPrice(product.price)}</span>
          <span className="shop-price-original">{formatPrice(product.originalPrice)}</span>
        </p>
      )}
      <div className="shop-actions">
        <button
          type="button"
          aria-label={`${product.name} 위시리스트`}
          aria-pressed={inWishlist}
          onClick={() => toggleWishlist(product.id)}
        >
          {inWishlist ? "찜 해제" : "찜"}
        </button>
        <button
          type="button"
          aria-label={`${product.name} 장바구니`}
          aria-pressed={inCart}
          onClick={() => toggleCart(product.id)}
        >
          {inCart ? "담김" : "담기"}
        </button>
      </div>
    </article>
  );
}
