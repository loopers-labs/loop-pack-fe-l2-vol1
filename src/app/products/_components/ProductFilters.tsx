'use client'

import { useEffect, useRef } from 'react'
import { useProductFilters } from '@/app/products/_components/useProductFilters'
import { SORT_OPTIONS } from '@/service/products/searchParams'
import type { Category } from '@/types/commerce'
import styles from './ProductFilters.module.css'

type ProductFiltersProps = {
  // 카테고리 목록의 원본은 서버 응답이다. 조회 실패·최초 로드처럼 아직 목록이 없을 때는
  // 빈 배열로 들어오고, "전체"만 보여주면서 검색·정렬은 계속 쓸 수 있게 둔다.
  categories: readonly Category[]
}

export const ProductFilters = ({ categories }: ProductFiltersProps) => {
  const { q, category, sort, setQuery, setCategory, setSort } = useProductFilters()
  const queryInputRef = useRef<HTMLInputElement>(null)

  // input은 타이핑 중인 값을 자체 보유하고, URL이 뒤로·앞으로 바뀔 때만 복원한다.
  useEffect(() => {
    if (queryInputRef.current && queryInputRef.current.value !== q) {
      queryInputRef.current.value = q
    }
  }, [q])

  // select가 주는 event.target.value는 string이라, 유효한 리터럴 값으로 좁힌 뒤 세터에 넘긴다.
  const handleCategoryChange = (value: string) => {
    const nextCategory = value === 'all' ? 'all' : categories.find(({ id }) => id === value)?.id
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
          ref={queryInputRef}
          name="q"
          placeholder="상품명 또는 브랜드"
          defaultValue={q}
          onChange={(event) => setQuery(event.target.value)}
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
