'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ProductGrid from '@/widgets/product-grid/ui/ProductGrid'
import { errorMessageOf, isRetryable } from '@/shared/api/http'
import { homeQuery } from '@/_pages/home/api/home'

const categoryLabels: Record<string, string> = {
  casual: 'Casual',
  fashion: 'Fashion',
  goods: 'Beauty & Goods',
  home: 'Home',
  digital: 'Digital',
}

// 홈에서 응답을 기다려야 하는 영역만 담는다. main과 Hero는 셸이 이미 그렸으므로
// 여기서 다시 그리지 않는다. 어떤 분기로 가든 이 자리를 벗어나지 않아야
// 기다리는 동안에도 셸이 화면에 남는다.
export default function HomeContent() {
  const { data, isPending, isError, error, refetch } = useQuery(homeQuery())

  if (isPending) {
    return (
      <section className="week05-section">
        <p>Loading home…</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="week05-section">
        <p>{errorMessageOf(error, 'Could not load home.')}</p>
        {/* 400대는 같은 요청을 다시 보내도 같은 실패다. 홈에는 되돌릴 조건이 없으므로
            재시도 대신 다른 화면으로 나가는 길을 준다. */}
        {isRetryable(error) ? (
          <button type="button" onClick={() => refetch()}>
            Try again
          </button>
        ) : (
          <Link href="/products">Browse products</Link>
        )}
      </section>
    )
  }

  const productSections = [
    { title: 'Popular', products: data.popularProducts },
    { title: 'New arrivals', products: data.newProducts },
  ]

  return (
    <>
      <section className="week05-section">
        <h2>Categories</h2>
        <div className="week05-categories">
          {data.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {categoryLabels[category.id] ?? category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 상품이 비어도 배너와 카테고리는 그대로 둔다. 빈 것은 상품 섹션뿐이다. */}
      {productSections.map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          {products.length === 0 ? (
            <p>No products to show yet.</p>
          ) : (
            <ProductGrid products={products} />
          )}
        </section>
      ))}
    </>
  )
}
