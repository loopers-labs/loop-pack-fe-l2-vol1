'use client'

import { useState } from 'react'

interface SearchFormProps {
  initialQuery: string
  onSearch: (query: string) => void
}

// 제출 전 검색어는 이 폼의 로컬 상태다. 제출할 때만 URL로 승격한다.
// 부모가 key로 URL의 q를 넘기므로 뒤로가기 복원 시 입력값도 URL을 따라간다.
export default function SearchForm({
  initialQuery,
  onSearch,
}: SearchFormProps) {
  const [draftQuery, setDraftQuery] = useState(initialQuery)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(draftQuery.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        검색
        <input
          name="q"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="상품명 또는 브랜드"
        />
      </label>
    </form>
  )
}
