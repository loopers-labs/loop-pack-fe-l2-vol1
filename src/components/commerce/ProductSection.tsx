import { ProductGrid } from "./ProductGrid";
import type { ProductCardItem } from "./ProductCard";
import type { Product } from "@/types/commerce";

type ProductSectionProps = {
  title: string;
  products: Product[];
};

export function ProductSection({ title, products }: ProductSectionProps) {
  const cardItems = products.map(mapProductToCardItem);

  return (
    <section className="mt-10">
      <h2 className="mb-4">{title}</h2>
      {cardItems.length > 0 ? (
        <ProductGrid products={cardItems} titleLevel={3} labelPrefix={title} />
      ) : (
        <p>표시할 상품이 없습니다.</p>
      )}
    </section>
  );
}

function mapProductToCardItem(product: Product): ProductCardItem {
  return {
    id: product.id,
    image: product.image,
    imageAlt: product.name,
    brand: product.brand,
    name: product.name,
    priceText: `${product.price.toLocaleString()}원`,
  };
}
