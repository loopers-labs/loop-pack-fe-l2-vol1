'use client'

import { useEffect } from 'react'
import styles from './page.module.css'

type RootErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

// 페이지 렌더링 중 발생한 예기치 못한 오류를 처리하는 App Router 에러 경계다.
// 홈을 useSuspenseQuery로 바꾸면서, 조회 실패 시 던져지는 에러도 이 경계가 함께 잡는다.
const RootError = ({ error, reset }: RootErrorProps) => {
  // 프로덕션에서는 원인 스택이 사용자 화면에 노출되지 않으므로, 최소한 콘솔에는 남긴다.
  // (외부 에러 리포팅을 붙인다면 이 자리를 교체한다.)
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>문제가 발생했어요</h1>
      <p className={styles.lead}>페이지를 표시하는 중 오류가 발생했습니다.</p>
      {error.digest && <p className={styles.lead}>오류 코드: {error.digest}</p>}
      <button type="button" onClick={() => reset()}>
        다시 시도
      </button>
    </main>
  )
}

export default RootError
