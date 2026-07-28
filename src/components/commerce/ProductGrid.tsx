import type { Product } from "@/types/commerce";
import { ProductCard } from "./ProductCard";
import styles from "./commerce.module.css";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
