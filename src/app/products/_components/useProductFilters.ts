import { useEffect } from 'react'
import { useQueryStates } from 'nuqs'
import { productListParsers } from '@/service/products/searchParams'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { CategoryId, ProductSort } from '@/types/commerce'

const SEARCH_DEBOUNCE_DELAY = 300

// 상품 목록 필터(검색·카테고리·정렬)의 URL 상태 훅.
// 모든 필터 변경은 여기서 page를 1로 되돌린다 → "필터 바꾸면 1페이지로" 규칙을 한 곳에서 보장한다.
// productListParsers에 결합돼 있어 공용 훅(src/hooks)이 아니라 라우트 전용으로 둔다.
export const useProductFilters = () => {
  const [{ q, category, sort }, setParams] = useQueryStates(productListParsers)

  const updateQueryParams = (value: string) => void setParams({ q: value, page: 1 })
  const { run: updateQueryParamsDebounced, cancel: cancelQueryUpdate } = useDebouncedCallback(
    updateQueryParams,
    SEARCH_DEBOUNCE_DELAY,
  )

  // 뒤로·앞으로 이동처럼 URL에서 q가 바뀌면 이전 입력의 대기 작업을 취소한다.
  useEffect(() => {
    cancelQueryUpdate()
  }, [cancelQueryUpdate, q])

  const setCategory = (value: CategoryId | 'all') => void setParams({ category: value, page: 1 })
  const setSort = (value: ProductSort) => void setParams({ sort: value, page: 1 })

  return { q, category, sort, setQuery: updateQueryParamsDebounced, setCategory, setSort }
}
