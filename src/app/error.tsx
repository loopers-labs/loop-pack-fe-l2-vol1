"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/commerce/commerce.module.css";

// 서버 데이터 조회 등에서 던진 에러를 잡는 세그먼트 경계.
// router.refresh() 로 서버 컴포넌트를 다시 가져오고 reset() 으로 경계를 재렌더한다.
// 둘을 startTransition 으로 묶어야 refresh 로 받은 새 서버 트리로 reset 이 커밋된다
// 묶지 않으면 reset이 먼저 캐시된 에러 트리로 재렌더돼 복구가 안 된다.
export default function AppError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  return (
    <main className={styles.page}>
      <p className={`${styles.status} ${styles.error}`}>
        화면을 표시하지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <button
        type="button"
        className={styles.retryButton}
        disabled={isRetrying}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      >
        다시 시도
      </button>
    </main>
  );
}
