'use client'

import styles from './page.module.css'

// 페이지 렌더링 중 발생한 예기치 못한 오류를 처리하는 App Router 에러 경계다.
const RootError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <main className={styles.page}>
    <h1 className={styles.title}>문제가 발생했어요</h1>
    <p className={styles.lead}>페이지를 표시하는 중 오류가 발생했습니다.</p>
    <button type="button" onClick={() => reset()}>
      다시 시도
    </button>
  </main>
)

export default RootError
