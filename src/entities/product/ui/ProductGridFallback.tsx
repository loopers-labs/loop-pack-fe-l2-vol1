import type { JSX } from 'react'

interface ProductGridFallbackProps {
  count: number
}

// 실제 카드와 같은 마크업 골격(.week05-product 안의 이미지·브랜드·이름·가격·액션)을
// 그대로 쓴다. 같은 grid·같은 1:1 이미지 비율이라 교체 시 자리가 움직이지 않는다.
// 홈(6개)과 목록(12개)이 함께 쓰므로 개수만 받는다.
function ProductCardFallback(): JSX.Element {
  return (
    <article className="week05-product">
      <div className="commerce-skeleton commerce-skeleton--image" />
      <div className="commerce-skeleton commerce-skeleton--brand" />
      <div className="commerce-skeleton commerce-skeleton--name" />
      <div className="commerce-skeleton commerce-skeleton--price" />
      <div className="week05-product__actions">
        <div className="commerce-skeleton commerce-skeleton--action" />
        <div className="commerce-skeleton commerce-skeleton--action" />
      </div>
    </article>
  )
}

export function ProductGridFallback({
  count,
}: ProductGridFallbackProps): JSX.Element {
  return (
    <div className="week05-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardFallback key={index} />
      ))}
    </div>
  )
}
