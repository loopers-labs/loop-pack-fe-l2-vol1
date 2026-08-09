import { PRODUCT_PAGE_SIZE } from '../model/searchParams'
import ProductResultsPending from './ProductResultsPending'

// 서버 셸이 조회를 기다리는 동안 내보내는 화면이다. 필터 줄과 결과 영역을 실제와 같은
// 자리로 예약한다.
//
// 이 자리에 빈 div만 두면 hard navigation에서 제목 아래가 응답이 끝날 때까지 비어 있다.
// 목록 skeleton은 ProductListView 안에도 있지만, 그 컴포넌트는 서버 prefetch가 끝난 뒤에야
// 내려오므로 최초 진입에는 쓰이지 않는다.
//
// pageSize는 URL이 아니라 화면이 정하는 값이라 searchParams를 기다리지 않고 쓸 수 있다.
// 여기서 기다리면 셸까지 함께 늦어진다.
export default function ProductListPending() {
  return (
    <>
      {/* 실제 필터와 같은 클래스를 써서 CSS가 같은 높이를 잡게 한다. 임의의 skeleton
          막대를 쌓으면 높이가 어긋나 결과가 도착할 때 아래가 통째로 밀린다.
          라벨은 조회와 무관한 고정 문구라 자리만 잡지 않고 그대로 보여준다. */}
      <div className="week05-filters" aria-hidden="true">
        <div className="product-search-field">
          <span>Search</span>
          <div className="product-filter-trigger" />
        </div>
        <div className="product-filter-control">
          <span>Category</span>
          <div className="product-filter-trigger" />
        </div>
        <div className="product-filter-control">
          <span>Sort</span>
          <div className="product-filter-trigger" />
        </div>
      </div>
      {/* 결과 영역의 역할과 진행 중이라는 사실은 fallback에서도 같아야 한다.
          여기서 aria-label이 빠지면 region이 생겼다 사라진다. */}
      <section
        className="week05-section"
        aria-label="Product results"
        aria-busy="true"
      >
        <ProductResultsPending count={PRODUCT_PAGE_SIZE} />
      </section>
    </>
  )
}
