# Week 03 Product List Separation of Concerns

## 목표

`src/productList/ProductListPage.tsx`에 섞여 있는 UI, API 호출, 상태 관리,
파생 계산을 분리한다. 기능 추가가 아니라 동작을 보존하면서 읽는 순서를 명확히
만드는 것이 목표다.

## 관심사 판별표

| 위치                                                               | 관심사                       | 분리 후보                                            | 분리하지 않을 근거                                                                   |
| ------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Product`, `ProductListResponse`, `SortBy`                         | 데이터 계약                  | `types.ts`                                           | 여러 레이어에서 함께 쓰이는 타입이라 컴포넌트 내부에 둘 이유가 약하다.               |
| `/api/products` 요청                                               | API 호출                     | `services/productService.ts`                         | 컴포넌트가 `fetch`, endpoint, query 조립을 직접 알 필요가 없다.                      |
| `products`, `totalCount`, `isLoading`, `error`                     | 서버 상태                    | `hooks/useProductList.ts`                            | 서버 상태 흐름은 UI 렌더링과 변경 이유가 다르다.                                     |
| `category`, `q`, `page`, `sort`, `minPrice`, `maxPrice`, `inStock` | 공유 가능한 화면 조건        | `hooks/useProductListQueryParams.ts`                 | URL로 표현 가능한 상태이므로 React state와 URL에 중복 저장하지 않는 방향이 적절하다. |
| `wishlist`                                                         | localStorage 클라이언트 상태 | `hooks/useWishlist.ts`                               | 외부 저장소 동기화 책임이므로 컴포넌트에서 분리한다.                                 |
| `recentlyViewed`                                                   | localStorage 클라이언트 상태 | `hooks/useRecentlyViewedProducts.ts`                 | 위시리스트와 별도 저장소 키와 갱신 정책을 가지므로 독립 훅으로 분리한다.             |
| `totalPages`, `pageNumbers`                                        | 파생값                       | `hooks/usePagination.ts` 또는 `Pagination` 내부 계산 | 원본 값에서 계산 가능하므로 state로 저장하지 않는다.                                 |
| 페이지네이션 JSX                                                   | UI                           | `components/Pagination.tsx`                          | 버튼 렌더링과 이동 핸들러 연결은 화면 책임이다.                                      |
| 상품 카드 JSX                                                      | UI                           | `components/ProductCard.tsx`                         | 목록 페이지가 카드 내부 배지, 가격, 하이라이트 렌더링까지 알 필요가 없다.            |
| 필터/검색/정렬 JSX                                                 | UI                           | `components/ProductFilters.tsx` 등                   | 입력 UI와 목록 페이지의 데이터 흐름을 분리할 수 있다.                                |
| `viewMode`                                                         | 로컬 UI 상태                 | 분리하지 않음                                        | grid/list는 서버 조회 조건이 아니라 표시 방식이므로 URL query hook에 넣지 않는다.    |
| `CATEGORIES`, `SORT_OPTIONS`                                       | 필터 UI 선택지               | 우선 컴포넌트 근처 유지                              | 현재 필터 UI에서만 사용하므로 전역 상수로 올리면 과한 분리일 수 있다.                |
| `PAGE_SIZE`                                                        | API 요청/페이지네이션 정책   | `constants.ts` 후보                                  | API 요청과 페이지 계산에 함께 쓰이므로 분리 근거가 있다.                             |

## 상태 분류

### 서버 상태

- `products`
- `totalCount`
- `isLoading`
- `error`

서버에서 가져온 결과와 요청 상태다. 컴포넌트가 직접 `fetch`를 호출하지 않고
`useProductList`가 service 함수에 의존하도록 분리한다.

### 클라이언트 상태

- `wishlist`
- `recentlyViewed`
- `viewMode`

`wishlist`와 `recentlyViewed`는 `localStorage`와 동기화되는 상태이므로 각각
Custom Hook으로 분리한다. `viewMode`는 단순 표시 방식이므로 페이지 로컬 상태로
유지한다.

### URL 상태

- `category`
- `q`
- `page`
- `sort`
- `minPrice`
- `maxPrice`
- `inStock`

공유하거나 새로고침 후 복원할 가치가 있는 목록 조회 조건이다. 최종적으로는 URL
query string을 source of truth로 두고, 핸들러는 React state가 아니라 URL query를
갱신하는 방향으로 정리한다.

### 파생값

- `totalPages`
- `pageNumbers`
- 상품 할인율
- 무료배송 표시 여부
- 신규 상품 표시 여부

원본 데이터에서 계산 가능한 값이므로 state로 저장하지 않는다.

## 분리 계획

### 1. 타입과 API 레이어 분리

- `Product`, `ProductListResponse`, `SortBy`를 `types.ts`로 이동한다.
- `/api/products` 요청 query 조립과 `fetch` 호출을 `productService.ts`로 이동한다.
- `ProductListPage`는 `getProducts` 함수에만 의존한다.

분리 근거: API 계약과 UI 렌더링은 변경 이유가 다르다.

### 2. 서버 상태 Hook 분리

- `products`, `totalCount`, `isLoading`, `error` 상태와 요청 effect를
  `useProductList`로 이동한다.
- `useProductList`는 `getProducts` service 함수에만 의존한다.

Hook 한 문장 설명:

> `useProductList`는 상품 목록 조회 조건에 따라 상품 목록 서버 상태를 가져온다.

### 3. URL query Hook 분리

- 필터, 검색어, 정렬, 페이지, 재고 옵션을 URL query string에서 읽는다.
- 필터 변경 핸들러는 URL query를 갱신한다.
- 검색어 입력은 즉시 반영할지, 임시 입력값을 둔 뒤 검색 시 반영할지 별도로 판단한다.

Hook 한 문장 설명:

> `useProductListQueryParams`는 상품 목록의 공유 가능한 조회 조건을 URL query string으로 관리한다.

### 4. localStorage Hook 분리

- `useWishlist`는 위시리스트 상품 id 목록을 관리한다.
- `useRecentlyViewedProducts`는 최근 본 상품 id 목록을 관리한다.

Hook 한 문장 설명:

> `useWishlist`는 위시리스트 상품 id를 localStorage와 동기화한다.

> `useRecentlyViewedProducts`는 최근 본 상품 id를 localStorage와 동기화한다.

### 5. 페이지네이션 분리

- 페이지 번호 계산은 `usePagination` 또는 `Pagination` 컴포넌트 내부로 이동한다.
- `page` 자체는 URL query에서 온 값으로 유지한다.
- 페이지 변경 시 스크롤 이동은 외부 시스템인 브라우저 스크롤과의 동기화이므로
  effect 사용 근거가 있다.

Hook 한 문장 설명:

> `usePagination`은 현재 페이지와 전체 개수에서 렌더링할 페이지 번호를 계산한다.

### 6. UI 컴포넌트 분리

- `ProductFilters`
- `ProductSearchBar`
- `ProductGrid`
- `ProductCard`
- `Pagination`

분리 근거: 페이지 컴포넌트는 데이터 흐름과 화면 구획 조합에 집중하고, 세부 UI는
컴포넌트로 이동한다.

## 분리하지 않을 결정

### `viewMode`는 URL query로 올리지 않는다.

`viewMode`는 상품 조회 조건이 아니라 grid/list 표시 방식이다. URL로 공유해야 하는
요구사항이 생기기 전까지는 로컬 UI 상태로 유지한다.

### `CATEGORIES`, `SORT_OPTIONS`는 우선 필터 UI 근처에 둔다.

현재는 필터 UI 선택지로만 사용된다. 여러 레이어에서 공유되기 전까지 전역
`constants.ts`로 올리면 기계적인 분리가 될 수 있다.
