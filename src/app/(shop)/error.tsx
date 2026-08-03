'use client';

import { useEffect } from 'react';

/**
 * 커머스 라우트의 예상 밖 렌더링 오류 fallback.
 *
 * 조회 실패는 여기까지 오지 않는다. 각 화면의 ErrorBoundary 가 먼저 잡고,
 * 4xx 는 아예 경계로 올리지 않는다. 여기 도달했다는 것은 컴포넌트 트리가
 * 손상됐다는 뜻이라 부분 복구를 신뢰할 수 없다.
 *
 * (shop) 세그먼트에만 두어 같은 레벨의 layout.tsx 는 살아남는다.
 * 즉 Header 와 페이지 골격은 유지되고 본문만 이 fallback 으로 바뀐다.
 * app/error.tsx 에 두면 layout 까지 날아가 Header 가 사라진다.
 */
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="week05-section" role="alert">
      <h2>화면을 표시하지 못했습니다.</h2>
      <p>일시적인 문제일 수 있습니다. 다시 시도해 주세요.</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
    </section>
  );
}
