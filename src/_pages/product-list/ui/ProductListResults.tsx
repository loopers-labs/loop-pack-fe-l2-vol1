import type { UseQueryResult } from '@tanstack/react-query'
import { PRODUCT_PAGE_SIZE, type GetProductListResponse } from '@/entities/product'
import { useProductPagination } from '@/_pages/product-list/model/useProductPagination'
import { Pagination } from '@/shared/ui/Pagination/Pagination'
import { NoticeBanner } from '@/shared/ui/NoticeBanner/NoticeBanner'
import { ProductGrid, ProductGridSkeleton } from '@/widgets/product-card'

export type ProductListQueryView = Pick<
  UseQueryResult<GetProductListResponse>,
  'data' | 'isPending' | 'isError' | 'isPlaceholderData'
> & {
  refetch: () => void
}

type ProductListResultsProps = {
  query: ProductListQueryView
  fallbackData: GetProductListResponse | undefined
}

/*
  상품 목록의 로딩·에러·빈 상태·목록을 단계별로 렌더링한다.
  예상 가능한 HTTP·네트워크 오류만 여기서 처리하고, API 계약 밖의 예외는 루트 error.tsx로 보낸다.
*/
export const ProductListResults = ({ query, fallbackData }: ProductListResultsProps) => {
  const { data, isPending, isError, isPlaceholderData, refetch } = query
  const displayData = data ?? fallbackData
  const { currentPage, totalPages, pageSize, goToPage } = useProductPagination(
    displayData?.totalCount ?? 0,
    PRODUCT_PAGE_SIZE,
  )

  // 폴백이 있어도 최초 진입은 최초 진입이다. 여기서 폴백을 그리면 다른 조건의 캐시가 남아 있을 때
  // 주소창은 새 조건인데 화면은 이전 목록이고, isPlaceholderData도 false라 로딩 표시조차 없다.
  if (isPending) {
    return <ProductGridSkeleton count={pageSize} />
  }

  if (isError && !displayData) {
    return (
      <div role="alert">
        <p>상품 목록을 불러오지 못했어요.</p>
        <button type="button" onClick={() => refetch()}>
          다시 시도
        </button>
      </div>
    )
  }

  /* 갱신 실패는 직전 목록을 유지한 채 흐름 밖의 배너로 알리고, 재시도 성공 시 사라진다. */
  const refreshErrorAlert = isError ? (
    <NoticeBanner
      label="상품 목록 갱신 오류"
      action={
        <button type="button" onClick={() => refetch()}>
          다시 시도
        </button>
      }
    >
      현재 조건의 상품 목록을 불러오지 못했어요. 아래는 이전 조건의 결과예요.
    </NoticeBanner>
  ) : null

  const products = displayData?.products ?? []
  if (products.length === 0) {
    /* 마지막 페이지를 넘어선 URL에서도 페이지네이션을 남겨 앞 페이지로 돌아갈 수 있게 한다. */
    const hasPageOverflow = (displayData?.totalCount ?? 0) > 0

    return (
      <>
        {refreshErrorAlert}
        <p>검색 결과가 없습니다.</p>
        {hasPageOverflow && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        )}
      </>
    )
  }

  return (
    <>
      {refreshErrorAlert}
      <p>총 {displayData?.totalCount ?? 0}개</p>
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
