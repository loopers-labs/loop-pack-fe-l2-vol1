# 5주차 과제 체크리스트

## 상태 설계

- [x] 구현 전에 `상태 · 소유자 · 수명 · 공유 범위 · 선택 이유` 표를 작성했는가
  - `docs/user/week-05-state-design.md`에 작성
- [x] 서버·URL·클라이언트·로컬 상태를 나눈 기준을 설명할 수 있는가
  - 서버 데이터(상품) → TanStack Query, URL 반영 필요(필터) → nuqs, 여러 페이지 공유(장바구니·위시리스트) → Zustand, 한 컴포넌트 UI → useState
- [x] 계산 가능한 값을 별도 상태로 중복 저장하지 않았는가
  - 장바구니 총 수량, 위시리스트 개수, 할인율, 총 페이지 수 모두 파생
- [x] 같은 데이터를 여러 저장소에 복사하지 않았는가
  - 서버 응답을 Zustand에 복사하지 않음

## TanStack Query

- [x] `QueryClientProvider`를 구성했는가
  - `src/app/providers.tsx`에서 QueryClientProvider + NuqsAdapter 조합
- [x] `queryOptions`로 query key·queryFn·staleTime을 함께 정의했는가
  - `src/queries/homeQueries.ts`, `src/queries/productQueries.ts`
- [x] 목록 조건이 query key와 API 요청에 모두 반영되는가
  - queryKey: `['products', { q, category, sort, page, pageSize }]`
- [x] staleTime과 gcTime의 근거를 기록했는가
  - `docs/user/week-05-state-design.md`의 캐시 전략 섹션에 기록
  - 다브랜드 이커머스(무신사 모델) 기준 staleTime: 0, gcTime: 기본 5분 (stale-while-revalidate)
- [x] 서버 응답을 Zustand에 복사하지 않았는가
- [x] 로딩·에러·빈 상태를 구분했는가
  - 홈: isLoading → 스피너, isError → 에러 메시지, 데이터 없음 → 빈 상태
  - 목록: 동일 + isFetching 인라인 인디케이터
  - 상세: 동일 + error.tsx 에러 바운더리

## nuqs / URL 상태

- [x] App Router용 `NuqsAdapter`를 구성했는가
  - `src/app/providers.tsx`에서 NuqsAdapter 적용
- [x] `useQueryStates`와 parser로 검색·카테고리·정렬·페이지를 관리하는가
  - `src/app/products/_hooks/useProductSearchParams.ts`
- [x] 검색·카테고리·정렬 변경 시 page가 1로 돌아가는가
  - setCategory, setSort, setSearch 모두 `{ ..., page: 1 }` 설정
- [x] 기본 정렬도 API 요청에 `sort=latest`로 명시하는가
  - `useProductSearchParams`에서 `sort: parseAsString.withDefault('latest')`
- [x] URL 공유·새로고침·뒤로 가기·앞으로 가기 후 같은 조건이 복원되는가
  - 수동 검증 완료 (2026-07-24)
  - `/products?category=fashion&sort=price-asc` 접속 → 필터 정상 반영
  - 새로고침(F5) → 같은 필터 유지
  - 카테고리 변경 → 뒤로가기 → 이전 필터로 복원
- [x] `scenario`를 사용자 URL 상태나 `ProductListQuery`에 넣지 않았는가

## Zustand

- [x] 장바구니·위시리스트의 담기·빼기를 구현했는가
  - 장바구니: `Map<string, CartItem>` + quantity, addItem/removeItem
  - 위시리스트: `Set<string>`, toggle
- [x] store 데이터 형태와 선택 이유를 설명할 수 있는가
  - 위시리스트 `Set<string>`: 과제 범위에서 찜/해제 토글 + 개수만 필요, O(1) 조회
  - 장바구니 `Map<string, CartItem>`: 같은 상품 중복 담기 시 quantity 증가, 실무에서 수량 변경·삭제 로직에 유리
- [x] 헤더 개수를 별도 저장하지 않고 파생했는가
  - 장바구니: `Map.values()`의 quantity 합산
  - 위시리스트: `Set.size`
- [x] Header와 상품 버튼이 필요한 값과 action만 selector로 구독하는가
  - 헤더: `(s) => s.items.values()` 합산, `(s) => s.ids.size`
  - 상품 버튼: `(s) => s.ids.has(product.id)`, `(s) => s.toggle`, `(s) => s.addItem`
- [x] 홈과 목록의 같은 상품 상태가 일치하는가
  - 수동 검증 완료 (2026-07-24): 홈에서 찜 → 목록에서 동일 상품 찜 상태 유지
- [x] 클라이언트 페이지 이동 중 상태와 헤더 개수가 유지되는가
  - 수동 검증 완료 (2026-07-24): 홈 → 목록 → 상세 이동 중 헤더 개수 유지

## 홈 / 목록

- [x] 홈에 배너·카테고리·인기 상품·신상품이 표시되는가
- [x] 목록의 검색·카테고리·정렬·페이지네이션이 동작하는가
- [x] 홈과 목록 모두 로딩·에러·빈 상태를 구분하는가
- [x] 제공 레이아웃을 사용했더라도 상태와 컴포넌트 경계는 직접 설계했는가

## 공통

- [x] 변경마다 "왜 이렇게 설계했는가" 한 줄 근거가 있는가
  - 캐시 전략, store 데이터 형태, API 방식 등 설계 근거를 `week-05-state-design.md`에 기록
- [x] 개발 중 `pnpm test`와 제출 전 `pnpm check`가 통과하는가
  - test 70/70, lint error 0, typecheck 통과, build 통과 (2026-07-24)
- [ ] AI로 생성한 부분을 표기하고 직접 검토했는가
