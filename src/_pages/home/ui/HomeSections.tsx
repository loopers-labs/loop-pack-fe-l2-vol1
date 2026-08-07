import Link from 'next/link'
import { connection } from 'next/server'
import type { JSX } from 'react'
import { getServerQueryClient } from '@/shared/api/getServerQueryClient'
import { homeQueryOptions } from '../api/queries'
import { ProductSection } from './ProductSection'

// 카테고리·인기·신상품은 모두 같은 홈 응답에서 나온다.
// HeroCopy와 같은 GET URL·options로 fetch하므로 같은 요청 안에서는
// Next의 fetch memoization이 중복 호출을 합친다(서버 호출 계수로 3단계에서 확인).
export async function HomeSections(): Promise<JSX.Element> {
  await connection()
  const queryClient = getServerQueryClient()
  const { categories, popularProducts, newProducts } =
    await queryClient.fetchQuery(homeQueryOptions())

  return (
    <>
      <section className="week05-section" aria-labelledby="home-categories">
        <h2 id="home-categories">카테고리</h2>
        <nav className="week05-categories" aria-label="카테고리 탐색">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </nav>
      </section>

      <ProductSection title="인기 상품" products={popularProducts} />
      <ProductSection title="신상품" products={newProducts} />
    </>
  )
}
