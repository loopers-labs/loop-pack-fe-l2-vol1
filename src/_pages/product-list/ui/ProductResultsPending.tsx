import ProductGridFallback from '@/widgets/product-grid/ui/ProductGridFallback'

interface ProductResultsPendingProps {
  count: number
}

// 보여줄 데이터가 아직 없을 때 결과 영역이 잡아 두는 자리다.
// 서버 Suspense fallback과 최초 pending이 같은 것을 그려야 한다. 둘이 갈라지면
// hard navigation에서는 빈 화면을, client 전환에서는 skeleton을 보게 된다.
//
// 개수 행과 안내 행과 페이지네이션까지 예약한다. 그리드만 잡으면 결과가 도착할 때
// 카드가 그 높이만큼 아래로 내려간다.
export default function ProductResultsPending({
  count,
}: ProductResultsPendingProps) {
  return (
    <>
      <p className="product-result-count" aria-hidden="true">
        <span className="product-skeleton product-skeleton-count" />
      </p>
      {/* 성공 상태가 늘 비워 두는 안내 행이다. 여기서 빠지면 결과가 도착할 때
          그 높이만큼 목록이 내려간다. */}
      <div className="product-result-notice" aria-hidden="true" />
      <ProductGridFallback count={count} />
      <div className="week05-pagination" aria-hidden="true">
        <span className="product-skeleton product-skeleton-pagination" />
      </div>
    </>
  )
}
