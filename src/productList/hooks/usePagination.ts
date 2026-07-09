import { useState } from 'react';

/**
 * 페이징 처리를 하는 커스텀 훅
 * - 분리 기준: 페이지가 변할 때마다, 스크롤이 상단으로 올라가야 한다는 제약이 있어 스크롤 관련 effect훅을 같은 훅에 넣는게 맞을지 고민이였습니다.
 * - 특정 상태가 변했을 때, 스크롤이 위로 올라간다는 것은 page 뿐만 아닌 다른 상태의 변화에서도 적용될 수 있다고 판단하였고, 해당 훅은 온전히 페이징 처리만 담당하도록 분리하였습니다.
 */
export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return { page, handlePageChange };
};
