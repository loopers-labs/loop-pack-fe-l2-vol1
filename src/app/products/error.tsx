"use client";

import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

// 목록 조회에서 render 중 throw 된 에러를 잡는 세그먼트 경계.
// layout 안(필터 아래)에서 렌더되므로 헤더·검색/정렬은 그대로 남고 목록 자리만 이 화면으로 교체된다. (Advanced C: 전체 페이지를 새로고침하지 않는 오류 재시도 경험)
export default function ProductListError({ reset }: { reset: () => void }) {
  // reset() 이 세그먼트를 remount → 새 useQuery observer 가 데이터 없는(에러만 있는) 쿼리에 붙어
  // 재요청을 강제하므로, 캐시 error 를 따로 지우지 않아도 복구된다.
  return (
    <div className={`${layout.status} ${app.error}`}>
      <p>상품 목록을 불러오지 못했습니다.</p>
      <button type="button" className={app.retryButton} onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
