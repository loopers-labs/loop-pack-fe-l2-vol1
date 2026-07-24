"use client";
import { useState } from "react";

// 입력 중(제출 전) 검색어는 로컬 초안이다. 제출해야 URL(원본)로 승격된다.
// URL q가 밖에서 바뀌면(뒤로/앞으로) 부모가 key로 이 컴포넌트를 리셋한다.
export function SearchForm({
  initialQuery,
  onSubmit,
}: {
  initialQuery: string;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialQuery);

  return (
    <form
      className="shop-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft.trim());
      }}
    >
      <label>
        검색
        <input
          name="q"
          value={draft}
          placeholder="상품명 또는 브랜드"
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <button type="submit">검색</button>
    </form>
  );
}
