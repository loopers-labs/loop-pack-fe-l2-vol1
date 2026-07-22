'use client';

import type { SubmitEvent } from 'react';

import { useProductListUrlState } from './search-params';

// 입력 중 검색어는 native input이 소유하고, 제출한 값만 URL로 확정한다.
// 확정 q를 key로 써서 뒤로·앞으로 가기로 q가 바뀌면 폼이 다시 만들어져 입력값이 복원된다.
export function ProductSearchForm() {
  const {
    conditions: { q },
    submitSearch,
  } = useProductListUrlState();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    submitSearch(String(new FormData(event.currentTarget).get('q') ?? ''));
  };

  return (
    <form key={q} className="week05-filters" onSubmit={handleSubmit}>
      <label>
        검색
        <input name="q" defaultValue={q} placeholder="상품명 또는 브랜드" />
      </label>
      <button type="submit">검색</button>
    </form>
  );
}
