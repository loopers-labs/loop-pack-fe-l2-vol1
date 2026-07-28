import type { UseQueryResult } from '@tanstack/react-query'
import type { GetProductListResponse } from '@/service/products/model'
import { usePagination } from '@/app/products/_components/usePagination'
import { Pagination } from '@/components/ui/pagination/Pagination'
import { ProductGrid } from '@/components/ui/productGrid/ProductGrid'
import { ProductGridSkeleton } from '@/components/ui/productGrid/ProductGridSkeleton'

type ProductListResultsProps = {
  query: UseQueryResult<GetProductListResponse>
}

// 상품 목록의 로딩·에러·빈 상태·목록을 단계별로 그리는 라우트 전용 컴포넌트.
// - isPending(최초 로드, 표시할 데이터 없음): skeleton 뼈대.
// - isError: useQuery는 에러 시 throw가 아니라 isError로 알리므로 루트 error.tsx가 못 잡는다.
//   목록 안에서 직접 에러 UI와 재시도(refetch)를 제공한다.
// - isPlaceholderData(조건 전환, 이전 목록 유지 중): 목록을 갈아끼우지 않고 흐리게만 처리해 깜빡임을 막는다.
export const ProductListResults = ({ query }: ProductListResultsProps) => {
  const { data, isPending, isError, isPlaceholderData, refetch } = query
  // 훅은 early return보다 위에서 호출한다(훅 규칙).
  const { currentPage, totalPages, pageSize, goToPage } = usePagination(data?.totalCount ?? 0)

  if (isPending) {
    return <ProductGridSkeleton count={pageSize} />
  }

  if (isError) {
    return (
      <div role="alert">
        <p>상품 목록을 불러오지 못했어요.</p>
        <button type="button" onClick={() => refetch()}>
          다시 시도
        </button>
      </div>
    )
  }

  const products = data?.products ?? []
  if (products.length === 0) {
    // totalCount > 0인데 목록이 비었다면 마지막 페이지를 넘어선 URL로 들어온 경우다.
    // 이때 페이지네이션까지 감추면 화면 안에서 앞 페이지로 돌아갈 방법이 없어진다.
    const hasPageOverflow = (data?.totalCount ?? 0) > 0

    return (
      <>
        <p>검색 결과가 없습니다.</p>
        {hasPageOverflow && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        )}
      </>
    )
  }

  return (
    <>
      <p>총 {data?.totalCount ?? 0}개</p>
      <div
        aria-busy={isPlaceholderData}
        style={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        <ProductGrid products={products} titleLevel={2} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </>
  )
}
