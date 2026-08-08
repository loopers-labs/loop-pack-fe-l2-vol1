interface ProductGridFallbackProps {
  // 이 조건에서 올 상품 수다. 실제 목록과 같은 수의 자리를 잡아야 교체가 조용하다.
  count: number
}

// 실제 목록이 들어올 자리를 미리 잡는다. 그리드와 카드 구조를 ProductGrid와 같은
// 클래스로 쓰는 이유는, 열 수와 이미지 비율과 카드 높이가 갈라지면 fallback이
// 실제 결과의 크기를 알려준다는 목적 자체가 무너지기 때문이다.
//
// 장식이라 접근성 트리에서 뺀다. 읽을 내용이 없는 상자 열두 개를 훑게 하는 대신,
// 기다리는 중이라는 사실은 화면 밖 status 문구가 전한다.
export default function ProductGridFallback({
  count,
}: ProductGridFallbackProps) {
  return (
    <div className="week05-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article className="week05-product" key={index}>
          <div className="week05-image" />
          <p className="week05-product-brand">
            <span className="product-skeleton product-skeleton-brand" />
          </p>
          <p className="week05-product-name">
            <span className="product-skeleton product-skeleton-name" />
          </p>
          <strong className="week05-product-price">
            <span className="product-skeleton product-skeleton-price" />
          </strong>
          <div>
            <span className="product-skeleton product-skeleton-action" />
            <span className="product-skeleton product-skeleton-action" />
          </div>
        </article>
      ))}
    </div>
  )
}
