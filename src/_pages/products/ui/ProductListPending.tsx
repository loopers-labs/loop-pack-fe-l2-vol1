import { PRODUCT_PAGE_SIZE } from '@/features/product';

/**
 * 한 페이지에 올 카드 수만큼 같은 골격을 그려, 목록이 차지할 크기를 미리 보여준다.
 * 크기는 실제 카드의 요소와 글자가 만들고, 색만 지워 자리가 어긋나지 않게 한다.
 */
export function ProductListPending() {
  return (
    <>
      {/* 글자는 화면에서만 지우고 남겨, 스크린 리더에는 대기 중임이 그대로 알려지게 한다. */}
      <p role="status">
        <span className="week05-skeleton">상품 목록을 불러오는 중입니다…</span>
      </p>
      <div className="week05-grid" aria-hidden="true">
        {Array.from({ length: PRODUCT_PAGE_SIZE }, (_, index) => (
          <article key={index} className="week05-product">
            <div className="week05-image" />
            <p className="week05-brand week05-skeleton">브랜드</p>
            <p className="week05-name week05-skeleton">상품 이름</p>
            <div className="week05-price">
              <strong className="week05-skeleton">00,000원</strong>
            </div>
            <div className="week05-product-actions">
              <button type="button" className="week05-skeleton" disabled>
                찜
              </button>
              <button type="button" className="week05-skeleton" disabled>
                담기
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
