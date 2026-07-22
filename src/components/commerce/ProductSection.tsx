import { ProductGrid } from "./ProductGrid";
import { mapProductToCardItem } from "./productCardAdapter";
import type { Product } from "@/types/commerce";

type ProductSectionProps = {
  title: string;
  products: Product[];
};

export function ProductSection({ title, products }: ProductSectionProps) {
  const cardItems = products.map(mapProductToCardItem);

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-gds-gray-900">{title}</h2>
      {cardItems.length > 0 ? (
        <ProductGrid products={cardItems} titleLevel={3} labelPrefix={title} />
      ) : (
        <p className="rounded-gds-md bg-white px-5 py-8 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
          표시할 상품이 없습니다.
        </p>
      )}
    </section>
  );
}
