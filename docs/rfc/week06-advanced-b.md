# Week 06 Advanced B — 변경 반경 실험

> `docs/rfc/week06-fsd.md`의 Advanced B(변경 반경 실험)를 실제로 구현하며 5단계로 기록한다.
> 대상: **상품 목록의 검색·카테고리·정렬 조건 전체 초기화**

## 1단계 — 구현 전 예상

**새 feature 슬라이스가 필요한가?**

아니오. `features/product-filter`가 이미 검색·카테고리·정렬·페이지(URL) 상태를 전부 소유하고 있어서, "전체 초기화"는 이 feature의 기존 책임 범위 안에 있는 새로운 액션이라고 본다.

**수정될 슬라이스**

`features/product-filter` 하나로 예상한다.

- `model/useProductListParams.ts` — `resetQuery` 함수 추가 (q/category/sort/page를 `DEFAULT_PRODUCT_LIST_QUERY` 기준으로 한번에 리셋)
- `ui/ProductFilters.tsx` — "초기화" 버튼 + `onReset` prop 추가
- 소비하는 페이지 `app/products/_ui/ProductView.tsx`도 한 줄 수정 예상 — `useProductListParams()`가 반환하는 `resetQuery`를 꺼내 `ProductFilters`에 `onReset`으로 내려줌

**변경될 Public API**

barrel을 안 쓰는 프로젝트라 `index.ts` 변경은 없다. 대신:

- `useProductListParams`의 반환 객체(이 훅의 실질적 공개 계약)에 `resetQuery` 필드가 하나 늘어난다
- `ProductFiltersProps`에 `onReset` prop이 하나 늘어난다

**예상 import 방향**

새로운 cross-layer import는 생기지 않을 것으로 예상한다. `resetQuery`가 `entities/product`의 `DEFAULT_PRODUCT_LIST_QUERY`를 참조하게 되는데, 이미 `feature → entity`로 허용된 방향이라 위반은 아니다.

## 2단계 — 구현

예상대로 `features/product-filter` 슬라이스 안에서 끝났다.

- `model/useProductListParams.ts` — `resetQuery` 함수 추가. `entities/product/model/product`의 `DEFAULT_PRODUCT_LIST_QUERY`를 그대로 `setParam`에 넘겨 q/category/sort/page를 한 번에 기본값으로 되돌린다.
- `ui/ProductFilters.tsx` — `ProductFiltersProps`에 `onReset: () => void` 추가, form 안에 `<button type="button" onClick={onReset}>초기화</button>` 추가.
- `app/products/_ui/ProductView.tsx` — `useProductListParams()`에서 `resetQuery`를 꺼내 `<ProductFilters onReset={resetQuery} />`로 연결.

`pnpm check`(test/lint/typecheck/build) 전부 통과 확인.

## 3단계 — 검증

Playwright로 `/products?q=셔츠&category=digital&sort=price-asc&page=1` 진입 후 "초기화" 버튼 클릭을 재현했다.

| 항목     | 초기화 전                                                               | 초기화 후                                     |
| -------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| URL      | `/products?q=%EC%85%94%EC%B8%A0&category=digital&sort=price-asc&page=1` | `/products` (기본값이라 파라미터 전부 생략됨) |
| 검색어   | `셔츠`                                                                  | `""`                                          |
| 카테고리 | `digital`                                                               | `all`                                         |
| 정렬     | `price-asc`                                                             | `latest`                                      |

## 4단계 — 예상 vs 실제 비교

| 관점              | 구현 전 예상                                                                       | 실제 결과   | 차이가 난 이유                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 수정한 슬라이스   | `features/product-filter` (+ 소비 페이지 `app/products/_ui/ProductView.tsx` 한 줄) | 예상과 동일 | 차이 없음 — `product-filter`가 이미 이 세 상태(q/category/sort)의 SoT를 전부 갖고 있어서, 새 액션도 자연스럽게 같은 슬라이스 안에 들어갔다 |
| 변경한 Public API | `useProductListParams` 반환값에 `resetQuery`, `ProductFiltersProps`에 `onReset`    | 예상과 동일 | 차이 없음 — 기존 `setQuery`/`setCategory`/`setSort` 패턴을 그대로 따라간 확장이라 새로운 설계 고민이 필요 없었다                           |
| 새로 생긴 의존    | `feature → entity`(`DEFAULT_PRODUCT_LIST_QUERY`), 새 cross-layer 없음              | 예상과 동일 | 차이 없음 — 이미 존재하던 상수를 재사용했을 뿐, 새로운 슬라이스나 새로운 import 방향이 생기지 않았다                                       |

## 5단계 — 회고

`features/product-filter`로 상품 필터 관련된 내용을 응집해 두었기 때문에 예상한 시나리오대로 큰 수정 없이 적용할 수 있었다.

만약 필터 관련된 내용을 여러 슬라이스에 흩어져 놓았다면 아마 상위에서 조합해야 하는 어려움이 발생되어 복잡성을 증가시켰을 것이다.
