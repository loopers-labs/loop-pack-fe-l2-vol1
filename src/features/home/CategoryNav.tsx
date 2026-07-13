import Link from "next/link";

const categories = ["캐주얼", "패션", "뷰티·잡화", "홈", "디지털"];

export function CategoryNav() {
  return (
    <section className="mt-10">
      <h2 className="mb-4">카테고리</h2>
      <div className="flex flex-wrap items-center gap-3">
        {categories.map((category) => (
          <Link
            className="border border-[#c8c8c8] bg-transparent px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
            key={category}
            href="/products"
          >
            {category}
          </Link>
        ))}
      </div>
    </section>
  );
}
