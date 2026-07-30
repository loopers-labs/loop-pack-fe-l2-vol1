import type { Product } from "@/entities/product";
import { ProductCard } from "@/components/commerce/ProductCard";
import styles from "@/components/commerce/commerce.module.css";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
