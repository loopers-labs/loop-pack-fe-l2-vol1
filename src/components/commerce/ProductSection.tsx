import { ProductGrid } from "./ProductGrid";
import type { ProductCardItem } from "./ProductCard";

type ProductSectionProps = {
  title: string;
  products: ProductCardItem[];
};

export function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="mb-4">{title}</h2>
      <ProductGrid products={products} titleLevel={3} labelPrefix={title} />
    </section>
  );
}
