# 5주차 이벤트 적용 현황

홈과 상품 목록에서 발생하는 사용자 이벤트가 어느 상태를 변경하고 어떤 화면을 갱신하는지 현재 구현 기준으로 정리했다.

관련 상태 경계는 [`state-design.md`](./state-design.md), 설계 판단 과정은 [`decisions.md`](./decisions.md)를 참고한다.

## 홈

| 컴포넌트           | 요소                     | 이벤트·구독           | 동작                                                                    | 상태 원본 | 적용 |
| ------------------ | ------------------------ | --------------------- | ----------------------------------------------------------------------- | --------- | ---- |
| Header             | 위시리스트·장바구니 개수 | Zustand selector 구독 | 각 store의 `ids.length`를 파생해 표시                                   | Zustand   | ✅   |
| CategorySection    | 카테고리 `Link`          | `href` 이동           | `/products?category=<id>`로 이동하고 나머지 조회 조건은 기본값으로 시작 | URL       | ✅   |
| ProductCardActions | `찜` 버튼                | `onClick`             | 위시리스트 상품 ID를 토글하고 `aria-pressed` 갱신                       | Zustand   | ✅   |
| ProductCardActions | `담기` 버튼              | `onClick`             | 장바구니 상품 ID를 토글하고 `aria-pressed` 갱신                         | Zustand   | ✅   |
| HeroBanner         | —                        | 없음                  | 서버 응답을 표시하는 정적 UI                                            | 서버 상태 | ✅   |

`ProductCard` 전체를 Client Component로 만들지 않고, 상호작용이 필요한 버튼만 `ProductCardActions` Client 리프로 분리했다. 홈과 상품 목록이 같은 store를 구독하므로 어느 화면에서 토글해도 Header 개수와 동일 상품 버튼 상태가 함께 갱신된다.

## 상품 목록

| 컴포넌트           | 요소                 | 이벤트·구독 | 동작                                                                                               | 상태 원본      | 적용 |
| ------------------ | -------------------- | ----------- | -------------------------------------------------------------------------------------------------- | -------------- | ---- |
| ProductFilters     | `form`               | `onSubmit`  | `preventDefault`로 제출 새로고침 방지                                                              | —              | ✅   |
| ProductFilters     | 검색 `input[name=q]` | `onChange`  | URL의 `q`를 갱신하고 `page`를 1로 초기화                                                           | URL            | ✅   |
| ProductFilters     | 카테고리 `select`    | `onChange`  | 유효한 category로 좁힌 뒤 URL을 갱신하고 `page`를 1로 초기화                                       | URL            | ✅   |
| ProductFilters     | 정렬 `select`        | `onChange`  | `latest`, `popular`, `price-asc`, `price-desc` 중 유효한 값으로 URL을 갱신하고 `page`를 1로 초기화 | URL            | ✅   |
| Pagination         | `이전` 버튼          | `onClick`   | URL의 `page`를 1 감소시키고 첫 페이지에서는 비활성화                                               | URL            | ✅   |
| Pagination         | `다음` 버튼          | `onClick`   | URL의 `page`를 1 증가시키고 마지막 페이지에서는 비활성화                                           | URL            | ✅   |
| ProductCardActions | `찜`·`담기` 버튼     | `onClick`   | 홈과 같은 위시리스트·장바구니 store를 토글                                                         | Zustand        | ✅   |
| ProductListResults | `다시 시도` 버튼     | `onClick`   | 실패한 상품 목록 query를 `refetch`                                                                 | TanStack Query | ✅   |

필터 변경 규칙은 `useProductFilters`, 페이지 변경 규칙은 `usePagination`에 둔다. 공용 `Pagination`은 nuqs를 직접 알지 않고 `currentPage`, `totalPages`, `onPageChange`만 받아 표시와 이전·다음 경계를 담당한다.

## 이벤트에서 조회까지의 흐름

```text
찜·담기 onClick
  → Zustand toggle(productId)
  → Header 개수와 같은 상품의 aria-pressed 갱신
  → persist가 localStorage에 ids 저장

필터 onChange
  → useProductFilters
  → nuqs가 URL 조건 갱신 + page 1 초기화
  → useQueryStates를 구독하는 products/page.tsx의 searchParams 변경
  → useProductListQuery(searchParams)의 query key 변경
  → 새 조건으로 GET /api/products 요청
  → ProductListResults 갱신

페이지 onClick
  → 공용 Pagination의 onPageChange
  → usePagination
  → nuqs가 URL page 갱신
  → query key 변경과 목록 재조회

오류 재시도 onClick
  → React Query refetch
  → 같은 query key로 GET /api/products 재요청
```

상품 목록은 조건 변경 중 `keepPreviousData`로 이전 결과를 유지한다. 이때 목록 컨테이너의 `aria-busy`와 투명도를 갱신해 새 데이터를 불러오는 중임을 표현한다.

## 히스토리 정책

- 검색어 `q`: 300ms debounce가 끝난 확정 검색어를 `push`해 검색 단위로 뒤로·앞으로 복원
- 카테고리·정렬·페이지·페이지 크기: 명시적 변경을 뒤로·앞으로 이동으로 복원할 수 있도록 `history: 'push'` 사용
- 홈 카테고리 링크: category만 포함한 새 상품 목록 URL로 이동
- Header의 상품 링크: 쿼리 없는 `/products`로 이동해 필터를 기본값으로 초기화

## 확인 결과

- 문서에 정의된 홈·상품 목록 이벤트가 모두 코드에 연결되어 있다.
- 정렬 옵션 4개가 구현되어 있다.
- Header 개수와 버튼의 `aria-pressed`는 하드코딩하지 않고 Zustand selector에서 파생한다.
- 장바구니·위시리스트는 상품 ID만 저장하므로 ProductCard가 이름·가격을 store에 전달할 필요가 없다. 상품 이름은 버튼의 접근 가능한 이름을 만드는 용도로만 사용한다.
- 목록 오류 상태에는 문서 초안에 없던 query 재시도 이벤트도 구현되어 있다.

---

_이 문서는 현재 구현을 정적 코드와 대조해 갱신했다. 문서 구성과 문장 정리는 AI(Codex)의 도움을 받았다._
