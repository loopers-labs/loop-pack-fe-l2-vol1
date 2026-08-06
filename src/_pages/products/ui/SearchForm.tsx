'use client';

import { useState, type FormEvent } from 'react';

export function SearchForm({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (q: string) => void;
}) {
  const [keyword, setKeyword] = useState(initialValue);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(keyword);
  };

  return (
    <form onSubmit={onSubmit}>
      <label>
        검색
        <input
          name="q"
          placeholder="상품명 또는 브랜드"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>
    </form>
  );
}
