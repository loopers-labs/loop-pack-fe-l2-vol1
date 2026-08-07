import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "../model/types";

const priceFormatter = new Intl.NumberFormat("ko-KR");
const formatPrice = (value: number) => `${priceFormatter.format(value)}원`;

// 상품의 "표현"만 책임진다. 담기·찜 같은 사용자 행위는 알지 못하고,
// actions 슬롯으로 받아 그리기만 한다 — entities가 features를 import하면 역방향 의존이다.
// 상품만 보여주는 화면은 actions 없이 쓴다(boolean prop이 필요 없다).
export function ProductCard({ product, actions }: { product: Product; actions?: ReactNode }) {
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
      {actions !== undefined && <div className="shop-actions">{actions}</div>}
    </article>
  );
}
