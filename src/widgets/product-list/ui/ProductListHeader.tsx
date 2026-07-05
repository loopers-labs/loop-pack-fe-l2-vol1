import { Show } from '@ilokesto/utilinent'

type ProductListHeaderProps = {
  readonly totalCount: number
  readonly wishlistCount: number
}

export function ProductListHeader({
  totalCount,
  wishlistCount,
}: ProductListHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="m-0 mb-1 text-[28px]">상품 목록</h1>
      <p className="m-0 text-sm text-[#666]">
        총 {totalCount.toLocaleString()}개의 상품
        <Show when={wishlistCount > 0}>
          <span> · 위시리스트 {wishlistCount}개</span>
        </Show>
      </p>
    </header>
  )
}
