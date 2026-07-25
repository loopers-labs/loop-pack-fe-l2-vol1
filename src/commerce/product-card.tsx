import Image from "next/image";
import type { Product } from "./api/types";
import { ProductActions } from "./product-actions";
import styles from "./commerce.module.css";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
        {product.price.toLocaleString("ko-KR")}원
        {product.originalPrice !== null && (
          <span>{product.originalPrice.toLocaleString("ko-KR")}원</span>
        )}
      </strong>
      <ProductActions productId={product.id} productName={product.name} />
    </article>
  );
}
