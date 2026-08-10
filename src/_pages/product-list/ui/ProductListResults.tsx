import type { UseQueryResult } from '@tanstack/react-query'
import { PRODUCT_PAGE_SIZE, type GetProductListResponse } from '@/entities/product'
import { useProductPagination } from '@/_pages/product-list/model/useProductPagination'
import { Pagination } from '@/shared/ui/Pagination/Pagination'
import { ProductGrid, ProductGridSkeleton } from '@/widgets/product-card'
import styles from './ProductListResults.module.css'

// 이 컴포넌트가 실제로 읽는 조회 결과 필드만 받는다. UseQueryResult 전체를 요구하면
// 테스트가 25개 필드짜리 union을 채워야 해서 단언 없이는 더블을 만들 수 없다.
export type ProductListQueryView = Pick<
  UseQueryResult<GetProductListResponse>,
  'data' | 'isPending' | 'isError' | 'isPlaceholderData'
> & {
  // 재조회는 호출만 하고 결과를 읽지 않으므로 반환을 좁힌다. 실제 refetch도 이 계약에 맞고,
  // 테스트 더블이 QueryObserverResult를 통째로 만들지 않아도 된다.
  refetch: () => void
}

type ProductListResultsProps = {
  query: ProductListQueryView
  // 현재 query key에 데이터가 없을 때 화면에 유지할 직전 목록. 캐시 조회 결과이며 복사본이 아니다.
  fallbackData: GetProductListResponse | undefined
}

// 상품 목록의 로딩·에러·빈 상태·목록을 단계별로 그리는 라우트 전용 컴포넌트.
// - isPending(최초 로드): 캐시에 다른 조건의 목록이 남아 있어도 skeleton 뼈대를 보여준다.
// - 최초 실패(표시할 데이터 없음): 목록 자리에 실패 이유와 재시도를 보여준다.
// - 갱신 실패(표시할 데이터 있음): 직전 목록을 그대로 두고 흐름 밖 알림으로 실패와 재시도를 알린다.
// - isPlaceholderData(조건 전환, 이전 목록 유지 중): 목록을 갈아끼우지 않고 흐리게만 처리해 깜빡임을 막는다.
// 예상 가능한 HTTP·네트워크 오류만 여기서 처리한다. 응답 파싱 오류 등 API 계약 밖의 예외는
// queryOptions가 루트 error.tsx로 보낸다.
export const ProductListResults = ({ query, fallbackData }: ProductListResultsProps) => {
  const { data, isPending, isError, isPlaceholderData, refetch } = query
  const displayData = data ?? fallbackData
  // 훅은 early return보다 위에서 호출한다(훅 규칙).
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

  // 갱신 실패다. 화면에는 직전 조건의 결과가 남아 있으므로 그 사실을 함께 알린다.
  // 자동으로 사라지지 않고 닫기 버튼도 두지 않는다. 갱신 실패는 통지가 아니라 사용자의 재시도가
  // 남아 있는 상태이고, 알림이 없어지면 화면이 성공 상태와 구별되지 않는다.
  // 재시도가 성공하거나 사용자가 조건을 다시 바꿀 때만 사라진다.
  // 흐름 밖(fixed)에 두는 이유는 목록 위에 끼워 넣으면 그 아래가 밀려 CLS가 생기기 때문이다.
  // 조건 변경 1.5초 뒤에 나타나므로 hadRecentInput 500ms 창에 걸리지 않아 그대로 집계된다.
  const refreshErrorAlert = isError ? (
    <div role="alert" className={styles.refreshError}>
      <p className={styles.refreshErrorMessage}>
        현재 조건의 상품 목록을 불러오지 못했어요. 아래는 이전 조건의 결과예요.
      </p>
      <button type="button" className={styles.refreshErrorRetry} onClick={() => refetch()}>
        다시 시도
      </button>
    </div>
  ) : null

  const products = displayData?.products ?? []
  if (products.length === 0) {
    // totalCount > 0인데 목록이 비었다면 마지막 페이지를 넘어선 URL로 들어온 경우다.
    // 이때 페이지네이션까지 감추면 화면 안에서 앞 페이지로 돌아갈 방법이 없어진다.
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
