import type { JSX } from 'react'
import { ProductGridFallback } from '@/entities/product'

const CATEGORY_CHIP_COUNT = 6
const HOME_SECTION_PRODUCT_COUNT = 6

// 카테고리 6칩 + 인기/신상품 각 6장. 실제 응답과 같은 개수라 교체 시 높이가 유지된다.
export function HomeSectionsFallback(): JSX.Element {
  return (
    <div aria-hidden="true">
      <section className="week05-section">
        <div className="commerce-skeleton commerce-skeleton--heading" />
        <div className="week05-categories">
          {Array.from({ length: CATEGORY_CHIP_COUNT }, (_, index) => (
            <div
              key={index}
              className="commerce-skeleton commerce-skeleton--chip"
            />
          ))}
        </div>
      </section>

      {['popular', 'new'].map((section) => (
        <section key={section} className="week05-section">
          <div className="commerce-skeleton commerce-skeleton--heading" />
          <ProductGridFallback count={HOME_SECTION_PRODUCT_COUNT} />
        </section>
      ))}
    </div>
  )
}
