import Link from "next/link";
import type { Category } from "@/types/commerce";

type CategoryNavProps = {
  categories: Category[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <section className="mt-10">
      <h2 className="mb-4">카테고리</h2>
      <div className="flex flex-wrap items-center gap-3">
        {categories.map((category) => (
          <Link
            className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
            key={category.id}
            href={`/products?category=${category.id}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
