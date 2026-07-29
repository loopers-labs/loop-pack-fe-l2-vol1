import Link from "next/link";
import type { Category } from "@/entities/category";

type CategoryNavProps = {
  categories: Category[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-gds-gray-900">카테고리</h2>
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((category) => (
          <Link
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gds-gray-900 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)] hover:bg-gds-green-50 hover:text-gds-green-700 hover:shadow-[inset_0_0_0_1px_var(--color-gds-green-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
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
