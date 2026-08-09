"use client";

import { useEffect, useState, type ChangeEvent } from "react";

export const SEARCH_DEBOUNCE_MS = 300;

type SearchInputProps = {
  // 현재 URL 의 검색어(외부 원본). 외부에서 바뀌면 입력창을 여기 맞춘다.
  searchTerm: string;
  // 새 검색의 첫 입력 — 새 히스토리 엔트리를 연다(push).
  onBeginSearch: (q: string) => void;
  // 진행 중인 검색어 갱신 — 현재 엔트리만 덮는다(replace).
  onUpdateSearch: (q: string) => void;
};

// 검색어 입력 컨트롤. URL 을 어떻게 쓸지(push/replace)는 콜백으로 주입받고,
// draft 세션(연속 타이핑을 한 엔트리로 묶기)만 로컬로 관리한다.
export function SearchInput({
  searchTerm,
  onBeginSearch,
  onUpdateSearch,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(searchTerm);

  // 현재 URL 엔트리가 '진행 중인 검색 draft'인지 여부.
  //  - false(직전 검색이 확정됐거나 외부에서 진입) → 다음 타이핑은 새 검색이므로 push(새 히스토리 엔트리).
  //  - true(이미 이 검색을 치는 중)             → 다음 타이핑은 replace(그 엔트리만 실시간 갱신).
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // 같은 라우트 안에서 URL 이 '외부에서' 바뀌면(헤더 "상품" 링크·뒤로가기) 이 컴포넌트는
  // unmount 없이 재사용돼 로컬 inputValue 가 옛 검색어로 남는다. prevSearchTerm 으로 그 변경을 감지한다.
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);

  // 외부 변경일 때만(=우리 draft 가 아닐 때) 입력창을 맞추고 draft 세션을 닫는다 → 다음 타이핑이 새 검색(push)이 된다.
  // (우리 draft 로 바뀐 경우엔 inputValue.trim() === searchTerm 이라 이 블록을 건너뛴다.)
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);

    if (inputValue.trim() !== searchTerm) {
      setInputValue(searchTerm);
      setIsEditingDraft(false);
    }
  }

  // 타이핑이 멈추면(디바운스 시간만큼 입력이 없으면) draft 세션을 닫는다 → 이어서 치면 새 검색(push)으로 잡힌다.
  // setState 는 타이머 콜백 안에서만 호출한다(effect 본문에서 직접 호출 아님 — 연쇄 렌더 방지).
  useEffect(() => {
    if (!isEditingDraft) return;

    const timer = setTimeout(
      () => setIsEditingDraft(false),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [inputValue, isEditingDraft]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const trimmed = value.trim();

    setInputValue(value);

    // 새 검색의 첫 입력은 push 로 새 엔트리를 열고, 이후 입력은 replace 로 그 엔트리만 실시간 갱신한다.
    // (조회 자체는 ProductList 가 URL q 를 디바운스해서 멈춘 뒤에만 요청한다 — 타이핑마다 요청 X)
    if (isEditingDraft) {
      onUpdateSearch(trimmed);
    } else {
      onBeginSearch(trimmed);
      setIsEditingDraft(true);
    }
  };

  return (
    <label>
      검색
      <input
        type="search"
        name="q"
        value={inputValue}
        onChange={handleChange}
        placeholder="상품명 또는 브랜드"
      />
    </label>
  );
}
