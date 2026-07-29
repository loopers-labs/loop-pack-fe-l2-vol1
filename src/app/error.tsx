'use client'

import Link from 'next/link'

interface ErrorBoundaryFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
}

// 최후 방어선이다. 조회 실패는 각 화면이 인라인으로 처리하므로 여기까지 오지 않는다.
// 여기 오는 것은 예상 밖 렌더링 오류, 즉 계약 위반이나 버그다. 화면은 복구 방법을 모른다.
// 근거는 RFC Decision 6에 있다.
//
// 루트 세그먼트에만 둔다. 세그먼트를 나누는 이유는 라우트마다 다른 복구 행동이 필요할 때인데,
// 예상 밖 오류의 복구는 어디서나 다시 시도와 화면 밖으로 나가기 둘뿐이다.
// 루트 layout 안에서 렌더되므로 Header가 살아 있고 다른 화면으로 나갈 수 있다.
export default function ErrorBoundaryFallback({
  error,
  reset,
}: ErrorBoundaryFallbackProps) {
  return (
    <main className="week05-section">
      <h1>화면을 그리지 못했습니다</h1>
      {/* 원인 메시지는 사용자에게 의미가 없지만, 문의나 재현에 쓸 수 있게 남긴다. */}
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        다시 시도
      </button>
      <Link href="/">홈으로</Link>
    </main>
  )
}
