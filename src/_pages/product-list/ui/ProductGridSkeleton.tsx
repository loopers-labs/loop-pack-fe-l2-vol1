// AI 생성: 데이터 없는 최초 진입에서 실제 목록과 같은 공간을 예약하는 폴백.
// 실제 카드와 같은 클래스·태그를 그대로 써서 열 수(5/3/2)와 이미지 비율이 CSS에서 자동으로 일치하게 한다.
// 빈 요소 대신 실제와 같은 버튼 텍스트를 넣고 색만 감추는 이유는, 텍스트가 만드는 상자 크기까지
// 같아야 교체 시점에 레이아웃이 밀리지 않기 때문이다.
interface ProductGridSkeletonProps {
  count: number;
}

export default function ProductGridSkeleton({ count }: ProductGridSkeletonProps) {
  return (
    <div className="product-grid" aria-hidden="true">
      {/* 고정 길이 폴백이라 재정렬·삽입·삭제가 없고 항목에 자체 상태도 없어 index를 key로 쓴다 */}
      {Array.from({ length: count }, (_, index) => (
        <article className="product-card product-card-skeleton" key={index}>
          <div className="product-card-image" />
          <p />
          <h2 />
          <strong />
          <div className="product-card-actions">
            <button type="button" disabled>
              찜
            </button>
            <button type="button" disabled>
              담기
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
