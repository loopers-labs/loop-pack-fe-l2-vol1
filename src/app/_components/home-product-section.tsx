import { Placeholder } from "@/app/_components/placeholder";
import { ProductCard } from "@/app/_components/product-card";
import type { Product } from "@/types/commerce";

type HomeProductSectionProps = {
  title: string;
  products: Product[];
};

export function HomeProductSection({ title, products }: HomeProductSectionProps) {
  return (
    <section className="week05-section">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <Placeholder title="보여줄 상품이 없어요" description="상품이 준비되면 보여드릴게요." />
      ) : (
        <div className="week05-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
