import type { Category } from "@/entities/product";
import Link from "next/link";

type HomeCategoryLinksProps = {
  categories: Category[];
};

export function HomeCategoryLinks({ categories }: HomeCategoryLinksProps) {
  return (
    <section className="week05-section">
      <h2>카테고리</h2>
      <div className="week05-categories">
        {categories.map((category) => (
          <Link key={category.id} href={`/products?category=${category.id}`}>
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
