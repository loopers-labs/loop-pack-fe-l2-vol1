import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "../model/types";
import styles from "../../../commerce/commerce.module.css";

export interface ProductCardProps {
  product: Product;
  actions?: ReactNode;
}

export function ProductCard({ product, actions }: ProductCardProps) {
  return (
    <article className={styles.product}>
      <Image
        className={styles.image}
        src={product.image}
        alt={product.name}
        width={400}
        height={400}
      />
      <p>{product.brand}</p>
      <h3>{product.name}</h3>
      <strong>
        <span className={styles.visuallyHidden}>판매가</span>
        {product.price.toLocaleString("ko-KR")}원
        {product.originalPrice !== null && (
          <s>
            <span className={styles.visuallyHidden}>정가</span>
            {product.originalPrice.toLocaleString("ko-KR")}원
          </s>
        )}
      </strong>
      {actions}
    </article>
  );
}
