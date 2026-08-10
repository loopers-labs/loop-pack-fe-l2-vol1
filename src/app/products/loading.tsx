import { ProductListSkeleton } from '@/widgets/product-list/ui/ProductListSkeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-(--color-ink)">
        상품 목록
      </h1>
      <div
        data-product-filter-shell="true"
        aria-hidden="true"
        className="mb-6 flex min-h-16 flex-wrap gap-3"
      >
        <div className="h-10 min-w-56 flex-1 rounded bg-(--color-surface-soft)" />
        <div className="h-10 w-32 rounded bg-(--color-surface-soft)" />
        <div className="h-10 w-32 rounded bg-(--color-surface-soft)" />
      </div>
      <section aria-label="상품 검색 결과">
        <p className="mb-4 text-sm text-(--color-muted)">
          상품 목록을 불러오는 중…
        </p>
        <ProductListSkeleton />
      </section>
      <div
        data-home-link-shell="true"
        aria-hidden="true"
        className="mt-8 h-5 w-16 rounded bg-(--color-surface-soft)"
      >
        {' '}
      </div>
    </main>
  )
}
