'use client'

import { useState } from 'react'
import { useProductFilters } from '@/_pages/product-list/model/useProductFilters'
import { SORT_OPTIONS } from '@/_pages/product-list/model/search-params'
import { PRODUCT_CATEGORY_FILTERS, type Category } from '@/entities/product'
import styles from './ProductFilters.module.css'

type ProductFiltersProps = {
  // 카테고리 목록의 원본은 서버 응답이다. 조회 실패·최초 로드처럼 아직 목록이 없을 때는
  // 빈 배열로 들어오고, "전체"만 보여주면서 검색·정렬은 계속 쓸 수 있게 둔다.
  categories: readonly Category[]
}

export const ProductFilters = ({ categories }: ProductFiltersProps) => {
  const { q, category, sort, setQuery, setCategory, setSort } = useProductFilters()
  const [draft, setDraft] = useState(q)
  const [syncedQ, setSyncedQ] = useState(q)

  // debounce 중인 입력은 draft가 보존한다. 뒤로·앞으로 가기처럼 URL이 외부에서
  // 변경된 경우에만 URL 검색어를 새 기준으로 삼아 입력값도 함께 복원한다.
  if (q !== syncedQ) {
    setSyncedQ(q)
    setDraft(q)
  }

  // select가 주는 event.target.value는 string이라, 유효한 리터럴 값으로 좁힌 뒤 세터에 넘긴다.
  // 좁히는 기준은 URL이 허용하는 값 목록이다. 서버가 내려준 categories로 검증하면 조회가 실패해
  // 목록이 비었을 때 카테고리 전환까지 막혀 실패 상태를 빠져나갈 수 없다.
  const handleCategoryChange = (value: string) => {
    const nextCategory = PRODUCT_CATEGORY_FILTERS.find((category) => category === value)
    if (!nextCategory) return
    setCategory(nextCategory)
  }

  const handleSortChange = (value: string) => {
    const nextSort = SORT_OPTIONS.find((option) => option.value === value)?.value
    if (!nextSort) return
    setSort(nextSort)
  }

  return (
    <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={draft}
          onChange={(event) => {
            const nextQuery = event.target.value
            setDraft(nextQuery)
            setQuery(nextQuery)
          }}
        />
      </label>
      <label>
        카테고리
        <select
          name="category"
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
        >
          <option value="all">전체</option>
          {categories.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        정렬
        <select name="sort" value={sort} onChange={(event) => handleSortChange(event.target.value)}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </form>
  )
}
