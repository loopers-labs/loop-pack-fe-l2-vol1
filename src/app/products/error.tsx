"use client";

import { useQueryClient } from "@tanstack/react-query";
import { productQueries } from "@/queries/products";
import styles from "@/components/commerce/commerce.module.css";

// 목록 조회에서 render 중 throw 된 에러를 잡는 세그먼트 경계.
// layout 안(필터 아래)에서 렌더되므로 헤더·검색/정렬은 그대로 남고 목록 자리만 이 화면으로 교체된다. (Advanced C: 전체 페이지를 새로고침하지 않는 오류 재시도 경험)
export default function ProductListError({ reset }: { reset: () => void }) {
  const queryClient = useQueryClient();

  // 목록 데이터는 클라이언트 useQuery 가 가져오므로 에러도 클라이언트 캐시에 남는다.
  // resetQueries 로 그 error 상태를 지워야 remount 시 재요청한다.
  const retry = () => {
    queryClient.resetQueries({ queryKey: productQueries.lists() });
    reset();
  };

  return (
    <div className={`${styles.status} ${styles.error}`}>
      <p>상품 목록을 불러오지 못했습니다.</p>
      <button type="button" className={styles.retryButton} onClick={retry}>
        다시 시도
      </button>
    </div>
  );
}
