import { useCallback } from 'react'
import { useQueryStates } from 'nuqs'
import type { CategoryId, ProductSort } from '@/entities/product'
import type { MockApiScenario } from '@/shared/api/types'
import { normalizeProductListParams } from './productListParams'
import { productListClientParsers } from './productListClientParsers'

// URL에서 파서 기본값까지 적용해 확정된 조건. 타입의 ProductListQuery는 전 필드가
// optional이라(요청 조립용) 여기서는 쓰지 않는다 — 읽는 쪽은 항상 값이 있다고 믿어도 된다.
export interface ProductListParams {
  q: string
  category: CategoryId | 'all'
  sort: ProductSort
  page: number
  pageSize: number
  scenario: MockApiScenario | null
}

export interface UseProductListQueryResult {
  query: ProductListParams
  setSearch: (q: string) => void
  setCategory: (category: CategoryId | 'all') => void
  setSort: (sort: ProductSort) => void
  setPage: (page: number) => void
  replacePage: (page: number) => void
}

// 목록 조건의 원본 = URL. nuqs로 타입 있는 URL 상태로 다룬다.
// 필터(q·category·sort)가 바뀌면 page를 1로 되돌리고, 페이지 이동만 page를 바꾼다.
// 한 번의 setQuery로 묶어 URL 변경·재요청·히스토리 항목이 각각 1번만 발생하게 한다.
export function useProductListQuery(): UseProductListQueryResult {
  const [urlQuery, setQuery] = useQueryStates(productListClientParsers, {
    history: 'push',
  })
  const query = normalizeProductListParams(urlQuery)

  // setQuery는 nuqs가 메모이즈해 주므로 아래 setter들도 렌더 간 참조가 유지된다.
  const setSearch = useCallback(
    (q: string): void => {
      void setQuery({ q, page: 1 })
    },
    [setQuery],
  )
  const setCategory = useCallback(
    (category: CategoryId | 'all'): void => {
      void setQuery({ category, page: 1 })
    },
    [setQuery],
  )
  const setSort = useCallback(
    (sort: ProductSort): void => {
      void setQuery({ sort, page: 1 })
    },
    [setQuery],
  )
  const setPage = useCallback(
    (page: number): void => {
      void setQuery({ page })
    },
    [setQuery],
  )
  // 잘못된 값을 바로잡는 이동이라 replace를 쓴다(push였다면 뒤로가기가 없는 페이지로 돌아감).
  const replacePage = useCallback(
    (page: number): void => {
      void setQuery({ page }, { history: 'replace' })
    },
    [setQuery],
  )

  return { query, setSearch, setCategory, setSort, setPage, replacePage }
}
