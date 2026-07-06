# Number Range Input 스펙

## 목표

상품 목록 페이지의 숫자 범위 input UI를 `NumberRangeInput` 컴포넌트로 분리하고, input 문자열과 가격 필터 상태 값 사이의 변환은 `ProductListPage` 호출부에서 연결한다.

## 비범위

- 필터 패널 전체 컴포넌트 분리
- 가격 범위 필터 그룹(`.filter-group`)과 라벨 분리
- 검색/정렬/보기 모드 툴바 분리
- 가격 필터 동작 변경 또는 validation 추가
- CSS 구조 변경

## 확정 목표

`NumberRangeInput`은 DOM input의 문자열 값을 그대로 받고 그대로 알린다. `ProductListPage`는 이 input 문자열을 `setFilter({ minPrice })`, `setFilter({ maxPrice })`에 맞는 `number | null` 값으로 변환해 연결한다. 바깥 필터 그룹과 `가격 범위` 라벨은 페이지에 남겨 화면 구조를 그대로 드러낸다.

## 조사 결과

- 최소 가격과 최대 가격 입력에서 같은 변환 규칙이 반복된다 (`src/productList/ProductListPage.tsx:120`, `src/productList/ProductListPage.tsx:133`).
- 가격 입력 UI는 `.price-range` CSS class를 사용한다 (`src/productList/ProductListPage.css:69`).
- 필터 패널의 다른 항목들도 `.filter-group`과 `label`로 화면 구조를 드러낸다 (`src/productList/ProductListPage.tsx:99`, `src/productList/ProductListPage.tsx:121`).
- 기존 필터 상태 변경은 `setFilter({ minPrice })`, `setFilter({ maxPrice })` 형태로 URL 쿼리 상태를 갱신한다 (`src/productList/ProductListPage.tsx:33`).
- `useProductFilters`는 범용 `setFilter`를 이미 제공한다 (`src/productList/hooks/useProductFilters.ts:27`).

## 결정 사항

- D1: `ProductFilterPanel` 전체가 아니라 숫자 범위 input 컴포넌트만 분리한다. 숫자 범위 input은 한 문장으로 설명되는 UI 책임이 있어 추상화 근거가 더 명확하다.
- D2: `NumberRangeInput`은 `.price-range` 영역과 input 문자열 이벤트만 담당한다. `number | null` 가격 필터 값 변환은 `ProductListPage` 호출부가 `setFilter`에 맞춰 처리한다.
- D3: `.filter-group`과 `가격 범위` 라벨은 `ProductListPage`에 남긴다.

## 완료 조건

- [ ] `ProductListPage`에서 가격 input 이벤트마다 반복되던 `Number(e.target.value)` 변환 로직이 제거된다.
- [ ] `NumberRangeInput`이 최소/최대 숫자 input 표시와 string 변경 이벤트를 담당한다.
- [ ] `useProductFilters`의 공개 API를 늘리지 않고 기존 `setFilter`로 가격 필터를 갱신한다.
- [ ] `ProductListPage`에 가격 범위의 바깥 `.filter-group`과 `label`이 남아 화면 구조가 드러난다.
- [ ] 기존 가격 필터 입력, 초기화, 상품 목록 조회 흐름이 유지된다.
- [ ] `pnpm build`와 `pnpm lint`가 통과한다.

## 태스크

- T1: `NumberRangeInput`을 string 기반 input 컴포넌트로 추가 — fulfills: 완료 조건 2
- T2: `ProductListPage` 호출부에서 string input 값을 기존 `setFilter`에 맞게 변환 — fulfills: 완료 조건 1, 3, 4, 5
- T3: `pnpm build`, `pnpm lint` 실행 및 자체 검증 — fulfills: 완료 조건 6
