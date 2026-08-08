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
      <h1>Something went wrong</h1>
      <p>
        Try again in a moment. If the problem continues, share the code below.
      </p>
      {/* error.message를 그대로 보여주지 않는다. 예상 밖 오류의 메시지에는 내부 경로나
          모듈 이름이 섞일 수 있고, 사용자에게는 어차피 의미가 없다.
          digest는 Next가 붙이는 식별자이고 서버 로그와 대조할 수 있다. */}
      {error.digest ? <p>Error code {error.digest}</p> : null}
      {/* reset은 복구가 아니라 재시도다. 원인이 데이터라면 다시 그려서 벗어날 수 있고,
          영구적인 렌더 버그라면 같은 화면이 다시 나온다. 그래서 출구를 하나 더 둔다. */}
      <button type="button" onClick={reset}>
        Try again
      </button>
      <Link href="/">Go home</Link>
    </main>
  )
}
