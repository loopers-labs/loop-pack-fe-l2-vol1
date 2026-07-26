'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import ProductCard from '@/components/commerce/ProductCard'
import { errorMessageOf, isRetryable } from '@/lib/commerce/api'
import { commerceQueries } from '@/lib/commerce/queries'

export default function HomePage() {
  const { data, isPending, isError, error, refetch } = useQuery(
    commerceQueries.home(),
  )

  if (isPending) {
    return (
      <main className="week05-section">
        <p>홈을 불러오는 중입니다.</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="week05-section">
        <p>{errorMessageOf(error, '홈 데이터를 불러오지 못했습니다.')}</p>
        {/* 400대는 같은 요청을 다시 보내도 같은 실패다. 홈에는 되돌릴 조건이 없으므로
            재시도 대신 다른 화면으로 나가는 길을 준다. */}
        {isRetryable(error) ? (
          <button type="button" onClick={() => refetch()}>
            다시 시도
          </button>
        ) : (
          <Link href="/products">상품 목록으로</Link>
        )}
      </main>
    )
  }

  const productSections = [
    { title: '인기 상품', products: data.popularProducts },
    { title: '신상품', products: data.newProducts },
  ]

  return (
    <main>
      <section className="week05-hero">
        <p>{data.banner.description}</p>
        <h1>{data.banner.title}</h1>
      </section>

      <section className="week05-section">
        <h2>카테고리</h2>
        <div className="week05-categories">
          {data.categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 상품이 비어도 배너와 카테고리는 그대로 둔다. 빈 것은 상품 섹션뿐이다. */}
      {productSections.map(({ title, products }) => (
        <section className="week05-section" key={title}>
          <h2>{title}</h2>
          {products.length === 0 ? (
            <p>아직 보여줄 상품이 없습니다.</p>
          ) : (
            <div className="week05-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  )
}
