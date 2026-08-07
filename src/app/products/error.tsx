'use client'

import { useEffect, type JSX } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// 예상치 못한 렌더링 오류를 잡는다. 목록 요청 실패는 ProductListPage 안에서
// 최초 실패와 갱신 실패로 나눠 처리한다.
export default function Error({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="commerce-status">
      상품 목록을 불러오는 중 문제가 발생했습니다.
      <br />
      <button type="button" className="commerce-retry-button" onClick={reset}>
        다시 시도
      </button>
    </main>
  )
}
