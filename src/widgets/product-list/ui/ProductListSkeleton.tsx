const PRODUCT_LIST_SLOT_COUNT = 12

export const PRODUCT_LIST_GRID_CLASS_NAME =
  'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'

function ProductListSlot({
  dataAttribute,
  invisible,
}: {
  readonly dataAttribute:
    | 'data-product-skeleton-slot'
    | 'data-product-geometry-slot'
  readonly invisible: boolean
}) {
  const dataAttributes =
    dataAttribute === 'data-product-skeleton-slot'
      ? { 'data-product-skeleton-slot': true }
      : { 'data-product-geometry-slot': true }

  return (
    <article
      {...dataAttributes}
      aria-hidden="true"
      className={`flex flex-col gap-2 ${invisible ? 'invisible' : ''}`}
    >
      <div className="aspect-square rounded-lg bg-(--color-surface-soft)" />
      <div className="h-4 w-2/5 rounded bg-(--color-surface-soft)" />
      <div className="h-9.5 rounded bg-(--color-surface-soft)" />
      <div className="h-6 w-3/5 rounded bg-(--color-surface-soft)" />
      <div className="h-8.5 rounded bg-(--color-surface-soft)" />
    </article>
  )
}

export function ProductListGeometrySlots({
  visibleProductCount,
}: {
  readonly visibleProductCount: number
}) {
  const missingSlotCount = Math.max(
    0,
    PRODUCT_LIST_SLOT_COUNT - visibleProductCount,
  )

  return Array.from({ length: missingSlotCount }, (_, index) => (
    <ProductListSlot
      key={`geometry-${String(index)}`}
      dataAttribute="data-product-geometry-slot"
      invisible
    />
  ))
}

export function ProductListSkeleton() {
  return (
    <div className={PRODUCT_LIST_GRID_CLASS_NAME} aria-hidden="true">
      {Array.from({ length: PRODUCT_LIST_SLOT_COUNT }, (_, index) => (
        <ProductListSlot
          key={`skeleton-${String(index)}`}
          dataAttribute="data-product-skeleton-slot"
          invisible={false}
        />
      ))}
    </div>
  )
}
