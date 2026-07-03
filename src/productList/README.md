# productList 레이어 분리 기록

## 구조

```
src/productList/
  ProductListPage.tsx         — UI 렌더링
  ProductListPage.css
  types.ts                    — 도메인 공유 타입 + 상수 (Product, Category, SortBy, PAGE_SIZE 등)
  _mockApi.ts                 — 스타터 제공 mock (과제 중 수정 금지)
  _hooks/
    useProductFilter.ts       — 필터·검색·페이지 상태 + URL 동기화 + debounce
    useProductList.ts         — 서버 상태 + fetch + 스크롤 동기화
    useWishlist.ts            — 위시리스트 상태 + localStorage 동기화
    useRecentlyViewed.ts      — 최근 본 상품 상태 + localStorage 동기화
    useDebounce.ts            — 입력값 debounce 제네릭 훅
  _components/
    HighlightText.tsx         — 검색어 하이라이팅 표시 전용 컴포넌트
  _services/
    productService.ts         — /api/products 요청/응답 캡슐화
  _utils/
    productUtils.ts           — 순수 계산 함수
```

---

## 왜 구조를 바꿨습니까

스타터 코드 `ProductListPage.tsx`는 534줄 단일 파일이었습니다. 문제는 동작 여부가 아니라 **변경 비용**이었습니다.

- 정렬 조건 하나를 바꾸려면 fetch 로직을 찾아 500줄을 읽어야 했습니다
- 가격 포맷 함수를 고치면 렌더 안에 묻혀있어 찾기 어려웠습니다
- 위시리스트와 서버 fetch가 같은 컴포넌트에 있어 어느 상태가 어떤 역할인지 파악하기 어려웠습니다

**분리 기준은 세 가지였습니다:**

1. **읽는 단위** — "이 파일만 봐도 이 기능의 흐름이 잡혀야 한다". 훅 파일만 봐도 상태 흐름이, 서비스 파일만 봐도 API 스펙이 보이는 것을 목표했습니다.
2. **변경 이유** — 변경 이유가 다른 코드는 다른 파일에 두었습니다. API 스펙이 바뀌면 service만, 필터 규칙이 바뀌면 훅만, 화면 레이아웃이 바뀌면 컴포넌트만 건드리게끔 하고 싶었습니다.
3. **분리하지 않을 이유** — 완성도도 중요하지만 학습 과정이기 때문에 제 스스로 이 분리에는 어떤 이유가 있는지를 한 문장으로 답할 수 없으면 분리하지 않았습니다.

---

## 관심사 분류표

스타터 코드 `ProductListPage.tsx` 534줄을 UI / 비즈니스 로직 / API / 상태로 훑고, 분리 여부를 판단했습니다.

| 위치 (스타터 기준)                                                                 | 관심사                      | 분리 후보                  | 분리하지 않을 근거                                                                                         |
| ---------------------------------------------------------------------------------- | --------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Product`, `SortBy` 타입 정의                                                      | 도메인 타입                 | `types.ts` ✅              | —                                                                                                          |
| `CATEGORIES`, `SORT_OPTIONS` 상수                                                  | UI 표시 데이터              | 분리하지 않음              | 컴포넌트 렌더링에서만 사용하고 변경 이유가 UI와 동일하다고 판단했습니다                                    |
| `PAGE_SIZE` 상수                                                                   | 도메인 상수                 | `types.ts` ✅              | —                                                                                                          |
| `category`, `minPrice`, `maxPrice`, `sortBy`, `searchQuery`, `page`, `inStockOnly` | URL/필터 상태               | `useProductFilter` ✅      | —                                                                                                          |
| 가격·검색어 debounce 로직                                                          | 입력 지연 처리              | `useDebounce` ✅           | —                                                                                                          |
| URL 쿼리 동기화 `useEffect`                                                        | 브라우저 히스토리 동기화    | `useProductFilter` 내부 ✅ | 필터 상태와 항상 함께 변경되므로 별도 훅으로 분리할 필요가 없다고 생각했습니다                             |
| `fetch('/api/products?...')` 호출                                                  | API 통신                    | `productService.ts` ✅     | —                                                                                                          |
| `products`, `totalCount`, `isLoading`, `error`                                     | 서버 상태                   | `useProductList` ✅        | —                                                                                                          |
| `inStockOnly` 클라이언트 필터링                                                    | 비즈니스 로직               | `useProductList` 내부 ✅   | fetch 결과를 후처리하는 로직이라 서버 상태 훅 안에 두는 게 자연스럽다고 생각했습니다                       |
| 스크롤 초기화 `useEffect`                                                          | 브라우저 외부 시스템 동기화 | `useProductList` 내부 ✅   | page 변경과 fetch가 함께 일어나서 같은 훅에 두는 게 맞다고 판단했습니다                                    |
| `wishlist` + localStorage 동기화                                                   | 클라이언트 상태 + 영속화    | `useWishlist` ✅           | —                                                                                                          |
| `recentlyViewed` + localStorage 동기화                                             | 클라이언트 상태 + 영속화    | `useRecentlyViewed` ✅     | —                                                                                                          |
| `viewMode` (`grid`/`list`)                                                         | UI 전용 상태                | 분리하지 않음              | 순수 UI 상태이고 서버 요청이나 URL과 무관해서 컴포넌트에 두는 게 적합하다고 생각했습니다                   |
| `calcDiscountRate`, `formatPrice`, `isNewProduct`, `calcPageNumbers`               | 순수 계산                   | `productUtils.ts` ✅       | —                                                                                                          |
| `highlightMatch` 인라인 함수                                                       | 표시 전용 렌더링            | `HighlightText.tsx` ✅     | —                                                                                                          |
| `isAlmostSoldOut`, `isSoldOut`, `isHot`, `isBest` 등                               | 파생값                      | 분리하지 않음              | 한 줄 파생값이라 util로 빼면 오히려 파편화된다고 생각했습니다                                              |
| 필터별 개별 훅 분리                                                                | 상태 분할                   | 분리하지 않음              | 카테고리·가격·정렬은 항상 같이 리셋되고 같이 쿼리에 실려서, 분리하면 page 리셋 규칙이 흩어질 것 같았습니다 |

---

## 분리한 것과 근거

### `_utils/productUtils.ts`

| 함수               | 근거                                                         |
| ------------------ | ------------------------------------------------------------ |
| `calcDiscountRate` | price·originalPrice만 받으면 결과가 결정되는 순수 함수입니다 |
| `formatPrice`      | 숫자 → 문자열 포맷팅, 상태·사이드이펙트가 없습니다           |
| `isNewProduct`     | createdAt 하나로 판별하며, 렌더링과 무관합니다               |
| `calcPageNumbers`  | page·totalPages → number[] 계산, 순수 함수입니다             |

**기준:** 인자만으로 결과가 결정되고, 상태·사이드이펙트가 없는 것을 util로 분리하는 게 맞다고 판단했습니다.

---

### `_hooks/useProductFilter.ts`

**한 문장 설명:** 필터·검색·페이지네이션 상태를 관리하고, 입력값에 debounce를 적용하며, 변경될 때마다 URL 쿼리를 동기화합니다.

**분리 근거:**

- 카테고리·가격·정렬·검색·재고 필터와 페이지 상태 7개가 하나의 관심사(사용자가 설정한 탐색 조건)로 묶인다고 생각했습니다
- 필터가 바뀌면 page를 1로 리셋하는 규칙이 반복되어 훅 안에서 일괄 처리하는 게 낫다고 판단했습니다
- URL 동기화 useEffect는 이 상태들에만 의존하므로 함께 두었습니다

**분리하지 않은 것:**

- 필터별로 훅을 쪼개지 않았습니다 — 카테고리·가격·정렬은 항상 같이 리셋되고 같이 쿼리에 실려서, 분리하면 page 리셋 규칙이 흩어질 것 같았습니다.

---

### `_hooks/useProductList.ts`

**한 문장 설명:** 필터 조건을 인자로 받아 서버에서 상품 목록을 가져오고, 페이지 변경 시 스크롤을 초기화합니다.

**분리 근거:**

- `products`, `totalCount`, `isLoading`, `error` 4개가 하나의 서버 요청 사이클로 묶인다고 생각했습니다
- 필터 상태를 인자로 받아 의존성을 명시적으로 드러내면, 컴포넌트가 fetch 구현을 몰라도 되겠다고 판단했습니다
- 스크롤 초기화는 page 변경과 fetch가 함께 일어나서 같은 훅에 두었습니다

---

### `_hooks/useWishlist.ts`

**한 문장 설명:** 위시리스트 상태를 관리하고 localStorage에 동기화합니다.

**분리 근거:**

- 상태 초기화(lazy initializer)·토글 핸들러·localStorage 동기화가 하나의 관심사로 묶인다고 생각했습니다
- 다른 페이지에서 위시리스트 기능을 재사용할 때 독립적으로 가져올 수 있을 것 같았습니다

---

### `_hooks/useRecentlyViewed.ts`

**한 문장 설명:** 최근 본 상품 목록을 관리하고 localStorage에 동기화합니다.

**분리 근거:**

- 상태 초기화·중복 제거·최대 10개 제한 규칙·localStorage 동기화가 하나의 관심사로 묶인다고 생각했습니다
- 도메인 규칙(최대 10개, 중복 시 맨 앞으로)이 훅 안에 캡슐화되어 외부에서 신경 쓸 필요가 없어졌습니다

---

### `_services/productService.ts`

**한 문장 설명:** `/api/products` 엔드포인트의 요청 파라미터 조립과 응답 파싱을 캡슐화합니다.

**분리 근거:**

- 훅이 fetch 구현에 직접 묶이면 통신 방식(fetch → axios 등)이 바뀔 때 훅도 수정해야 해서 분리했습니다
- 엔드포인트 URL·쿼리 파라미터 조립·응답 타입이 한 곳에 모이니 API 스펙을 한눈에 파악할 수 있었습니다
- 타입은 `types.ts`에서 import하므로 service는 통신 로직에만 집중할 수 있게 되었습니다

---

### `_hooks/useDebounce.ts`

**한 문장 설명:** 값이 변경된 후 일정 시간이 지나야 반영되도록 지연시키는 제네릭 훅입니다.

**분리 근거:**

- `useProductFilter` 내부에 debounce 로직을 인라인으로 두면 필터 훅의 책임이 커질 것 같았습니다
- 제네릭(`T`)으로 작성해 가격·검색어 등 타입 무관하게 재사용할 수 있게 했습니다
- debounce 타이머 관리(setTimeout/clearTimeout)를 캡슐화해 사용처에서 구현을 몰라도 되게 했습니다

---

### `_components/HighlightText.tsx`

**한 문장 설명:** 검색어와 일치하는 텍스트를 `<mark>`로 강조해 반환하는 표시 전용 컴포넌트입니다.

**분리 근거:**

- JSX를 반환하므로 util 함수가 아닌 컴포넌트로 분류했습니다
- `map` 내부에 인라인으로 정의되어 렌더마다 새 함수가 생성되던 문제를 해결했습니다
- `text`·`query` props만으로 동작하는 순수 표시 컴포넌트로, 상태·사이드이펙트가 없습니다

---

### `types.ts`

**한 문장 설명:** `Product`, `ProductListResponse`, `Category`, `SortBy` 등 도메인 전체에서 공유하는 타입을 한 곳에 정의합니다.

**분리 근거:**

- 스타터 코드에서는 같은 `Product` 타입이 컴포넌트·서비스에 중복 정의되어 있었고, `Category`·`SortBy`도 훅·컴포넌트에 각각 선언되어 있었습니다
- 타입이 분산되면 필드 하나를 추가할 때 여러 파일을 동시에 수정해야 하고, 누락 시 동기화 실수로 버그가 생길 수 있다고 생각했습니다
- `PAGE_SIZE` 같은 도메인 상수도 `useProductList`와 `ProductListPage`에 각각 선언되어 있었습니다. 값이 달라지면 페이지네이션 계산과 실제 fetch 크기가 어긋날 수 있어 함께 통합했습니다
- 단일 `types.ts`에 모으니 "이 도메인에 어떤 타입과 상수가 있는가"를 한 파일로 파악할 수 있게 되었습니다

---

## 분리하지 않은 것과 근거

| 항목                                       | 이유                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `viewMode` (`grid`/`list`)                 | 순수 UI 상태이고 서버 요청이나 URL과 무관해서 컴포넌트에 두는 게 적합하다고 생각했습니다.                   |
| `isAlmostSoldOut`, `isSoldOut`, `isHot` 등 | 한 줄 파생값이라 util로 빼면 오히려 파편화된다고 생각했습니다.                                              |
| 필터별 훅 분리                             | 카테고리·가격·정렬은 항상 같이 리셋되고 같이 쿼리에 실려서, 분리하면 page 리셋 규칙이 흩어질 것 같았습니다. |
