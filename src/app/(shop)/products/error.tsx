"use client";

// 예상하지 못한 렌더링 오류의 fallback. 코드 버그라 화면 안에서 복구할 수단이 없어
// 라우트 단위로 격리한다 — layout의 헤더는 살아 있으므로 다른 화면으로 이동할 수 있다.
// 조회 실패(5xx)도 throwOnError 기준에 걸리면 여기로 온다.
export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shop-page">
      <section className="shop-section" role="alert">
        <h1>상품 화면에 문제가 생겼습니다</h1>
        <p>일시적인 오류일 수 있습니다. 다시 시도해 주세요.</p>
        <button type="button" onClick={reset}>
          다시 시도
        </button>
      </section>
    </main>
  );
}
