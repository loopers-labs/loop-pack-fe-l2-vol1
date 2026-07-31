# 6주차 RFC — 커머스 FSD 전환

> 작성 시 AI 보조([AI])를 활용했다. 제출 전 결정·근거·표를 직접 검토했다.
> 기준선: 0단계에서 직접 확인한 동작(정상·로딩·에러·빈 / 검색·카테고리·정렬·페이지 / URL 공유·새로고침·앞뒤 / 장바구니·위시리스트 동기화)을 그대로 보존한다.

---

## 0단계 — 동작 기준선 검증 결과

폴더를 옮기기 전 기준선을 고정했다. API 계약은 단위 테스트(78개)와 dev 서버 런타임 curl로, URL/상태 로직은 훅 단위 테스트로, 빌드는 `pnpm check`로 확인했다.

### 항목별 결과

| 검증 항목                       | 방법                                                      | 결과                                                                                                                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 홈·목록 정상·로딩·에러·빈       | API 단위 테스트 + dev 서버 curl + 렌더링 분기 코드 점검   | 정상(`/api/home` 200, popular 6/new 6/categories 5), 빈(`/products?scenario=empty` → products `[]`, total 0, categories 유지), 에러(`/home?scenario=error`→500, `/products?scenario=error`→500) 모두 확인. 로딩/에러/빈 렌더링 분기는 `HomeContent.tsx`, `products/page.tsx`에 존재 |
| 홈 서버 prefetch                | dev 서버 로그                                             | SSR 중 `GET /api/home 200 in 504ms`(500ms 고정 지연) 확인 → `HydrationBoundary` 정상                                                                                                                                                                                                |
| 검색·카테고리·정렬·페이지네이션 | API curl + `useProductListFilters` 테스트                 | 검색 `q=스탠리`→p16,17,19,20 / `category=digital&sort=popular`→p21,22,30,23,25,24 / `page=3`→잔여 6개. 단위 테스트로 전 sort 순서·페이지 검증                                                                                                                                       |
| URL 공유·새로고침·뒤로/앞으로   | `useProductListFilters` 단위 테스트(nuqs testing adapter) | URL→state 복원, 한글 round-trip, 리터럴 외값 기본값 폴백, `history:'push'` 기록, 필터 변경 시 page 1 리셋 검증                                                                                                                                                                      |
| 장바구니·위시리스트 동기화      | store 코드 점검 + selector 파생 확인                      | toggle/remove/clear, persist(`hasHydrated` hydration mismatch 방지, `version`/`migrate`), 헤더 개수는 `useCartCount`/`useWishlistCount`로 파생(별도 저장 X). **자동화 테스트 없음**(아래 권장)                                                                                      |
| `pnpm check`                    | `pnpm check` 실행                                         | **수정 후 전체 통과**(test 78 / lint / typecheck / build). 아래 결함 참고                                                                                                                                                                                                           |

### 발견된 기준선 결함 (수정 완료)

`pnpm build`가 `/products` 정적 프리렌더에서 실패했다.

- **재현**: `pnpm build` → `useSearchParams() should be wrapped in a suspense boundary at page "/products"`
- **원인**: nuqs `useQueryStates`가 내부적으로 `useSearchParams()`를 호출하는데, `/products` 페이지 컴포넌트 최상위에서 사용해 Suspense 경계 없이 정적 프리렌더가 불가능(CSR bailout).
- **수정 위치**: `src/app/products/page.tsx` — useQueryStates를 쓰는 본문을 `ProductsView`로 분리하고 `ProductsPage`에서 `<Suspense>`로 래핑. 구조 변경(기능 변경 아님)이라 0단계에서 단독 처리.
- **검증 결과**: 재실행 시 build 통과, `/`·`/products` 정적 프리렌더 성공(`/api/*`는 동적). test 78개·lint·typecheck 영향 없음.

### 브라우저 검증 (Playwright E2E 자동화)

브라우저 구동이 필요한 테스트 항목은 Playwright E2E로 자동화했다. `pnpm test:e2e`로 dev 서버를 자동 시작해 chromium로 검증한다(11개 케이스 전부 통과). 로딩/에러/빈 상태는 페이지가 `scenario`를 URL로 넘기지 않으므로 `page.route`로 `/api/products` 응답을 제어해 유발한다.

| 항목                        | 스펙 파일                   | 검증 내용                                                                                                                     |
| --------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 4종 상태(정상·로딩·에러·빈) | `e2e/states.spec.ts`        | 정상(카드+총개수), 로딩(route 지연→"불러오는 중..."), 에러(500→메시지+"다시 시도"), 빈(`products:[]`→"검색 결과가 없습니다.") |
| 찜·담기 동기화              | `e2e/cart-wishlist.spec.ts` | 토글 즉시 버튼 라벨·헤더 개수 반영, 홈↔목록 이동 시 헤더 개수·같은 상품 토글 상태 유지                                        |
| persist 새로고침 복원       | `e2e/cart-wishlist.spec.ts` | 토글 후 `reload()` → 상태 복원(`hasHydrated` 비동기 rehydrate 대기)                                                           |
| hydration 안전성            | `e2e/cart-wishlist.spec.ts` | persist 보유 상태에서 새로고침 시 `hydrat`/`did not match` 콘솔·pageerror 부재                                                |
| URL 뒤로/앞으로 복원        | `e2e/navigation.spec.ts`    | 검색어·카테고리 push 후 `goBack`/`goForward`로 URL·입력값 복원, 필터 변경 시 page 1 리셋                                      |

> vitest(단위)와 분리: `vitest.config.ts`의 `exclude`에 `e2e/**` 추가, `tsconfig.json` `exclude`에 `e2e`/`playwright.config.ts` 추가. 단위 78개·lint·typecheck·build·e2e 11개 모두 통과.

### store 자동화 테스트 적용 (0단계 권장 → 완료)

장바구니·위시리스트 store에 자동화 테스트가 없어(week-05 Advanced D 미적용), FSD 전환 전에 계약을 테스트로 보호했다. 단위 테스트 25개를 추가해 전체 103개 통과.

| 테스트 파일                                         | 검증 내용                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/features/store-product/store/cart.test.ts`     | `toggle`(추가/제거/독립), `remove`(id/없는id), `clear`, `useCartCount`/`useIsInCart`/`useCartHasHydrated` 파생 |
| `src/features/store-product/store/wishlist.test.ts` | 위와 대칭                                                                                                      |
| `src/features/store-product/store/migrate.test.ts`  | `isStoredItem`(정상/거른다), `migrateStoredItems`(필터링/폴백/fromVersion 무관)                                |

### 테스트 적용 중 발견한 migrate 결함 (수정 완료)

`migrate.test.ts`를 작성하며 잠재 결함이 드러났다.

- **재현**: `isStoredItem({ id: 'p1' })` → `false`. version이 다를 때 `migrateStoredItems`가 모든 아이템을 빈 배열로 만든다.
- **원인**: `isStoredItem`이 `name/price/image`를 요구했지만, 실제 저장값은 `CartItem = Pick<Product, 'id'>`로 `{ id }`만 갖는다. 저장 shape과 검증이 불일치.
- **왜 지금까지 안 드러났나**: persist `version`이 현재 값과 같으면 `migrate`가 아예 실행되지 않아 일반 새로고침에선 복원이 정상 동작했다(e2e도 통과). version을 올리는 스키마 업그레이드 순간에만 모든 항목이 삭제될 잠재 결함.
- **수정 위치**: `src/features/store-product/store/migrate.ts` — `isStoredItem`을 저장 shape에 맞게 `id`(비어있지 않은 문자열)만 검증하도록 좁힘. 동작 변경(구조 변경 아님)이라 0단계에서 단독 처리.
- **검증 결과**: migrate 테스트 7개 통과, 단위 103개·lint·typecheck 영향 없음.

> 새 단위 테스트 파일(`*.test.ts`)은 `.gitignore`의 `*.test.*` 규칙으로 무시된다(기존 테스트는 이미 추적돼 예외). 제출 시 `git add -f`로 강제 추가하거나 규칙을 조정해야 한다.

---

## R — Requirements

### 기능 요구사항 (5주차까지, 반드시 보존)

- **홈**: 배너·카테고리·인기 상품·신상품 표시. 정상·로딩·에러(재시도)·빈 상태 분기.
- **상품 목록**: 검색(debounce 300ms)·카테고리·정렬·페이지네이션. 같은 4종 상태 분기.
- **URL 상태**: `q / category / sort / page` 를 nuqs로 관리, `history: 'push'`. 공유·새로고침·뒤로/앞으로 복원. 검색·카테고리·정렬 변경 시 page 1 reset.
- **장바구니·위시리스트**: 담기/빼기 토글, 헤더 개수, 홈·목록 양쪽 상태 동기화. `persist`(localStorage) + `hasHydrated` hydration mismatch 방지 + `version`/`migrate`.
- **성능(Advanced C)**: 홈 서버 prefetch(`HydrationBoundary`), 홈 카테고리 hover/focus prefetch, 목록 다음 페이지 prefetch, `keepPreviousData` placeholder.

### 비기능 요구사항

- TanStack Query `queryOptions` 팩토리(query key·queryFn·staleTime·gcTime·placeholderData).
- 서버·URL·클라이언트·로컬 상태의 Source of Truth는 폴더 이동으로 달라지지 않는다(같은 데이터 중복 저장 금지).
- `pnpm check`(test·lint·typecheck·build) 통과.

### 이번에 반드시 보존할 동작

- **홈·상품 목록의 4종 상태**: 정상·로딩·에러(재시도)·빈 결과 분기가 그대로 동작.
- **목록 조작**: 검색·카테고리·정렬·페이지네이션이 의도대로 동작. 검색·카테고리·정렬 변경 시 page 1 reset.
- **URL 무결성**: URL 공유·새로고침·뒤로/앞으로 가기 후 같은 조건 복원.
- **장바구니·위시리스트 동기화**: 홈과 목록 양쪽에서 같은 상품의 토글 상태가 일치. 페이지 이동 중에도 Zustand store·헤더 개수가 유지.
- **persist 안정성**: 새로고침 후 장바구니·위시리스트 복원, hydration mismatch 없음, `version`/`migrate` 동작.
- **캐시 적중**: query key 구조(`['home', scenario]`, `['products', 'list', query]`)를 그대로 유지해 이전 캐시가 깨지지 않음.
- **이미 적용된 최적화(Advanced C)** 유지: 홈 서버 prefetch·홈 카테고리 hover/focus prefetch·목록 다음 페이지 prefetch·검색 debounce 300ms·`keepPreviousData` placeholder.

### 이번 주에 **하지 않을** 것과 이유

| 제외 항목                                        | 이유                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/app/api/**` Route Handler·mock fixture 이동 | 프론트엔드와 mock 백엔드 경계. 동작 보존이 우선이라 전환 범위에서 제외. |
| 상품 상세 페이지·장바구니 페이지·수량·합계 금액  | 5주차 범위 밖. 구조 변경과 기능 추가를 한 커밋에 섞지 않는다.           |
| 로그인·서버 위시리스트 동기화                    | 서버 원본이 생기기 전 단계. 소유권 이슈는 5주차 기록으로 충분.          |
| 4주차 `components/ui`(dialog·select) 동작 변경   | UI 컴포넌트는 위치만 `shared/ui`로 옮기고 API·동작 유지.                |
| `processes` 레이어·빈 `index.ts`·미사용 세그먼트 | "필요 없는 레이어를 만들지 않는 것도 설계" 기준 적용.                   |

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

1. **`features/` 가 FSD features 가 아니다.** `features/home`, `features/product`는 데이터 조회·표현(`entities`/`widgets` 후보)을 담고 있고, `features/store-product`는 장바구니·위시리스트 **행위**(`features`)를 담는다. 폴더 이름이 FSD 레이어와 불일치하여 "이 파일은 어디에?"에 답할 수 없다.
2. **`ProductCard`가 역방향 의존.** `features/product/ui/ProductCard.tsx:6-7`이 `store-product/ui/CartButton·WishlistButton`을 직접 import 한다. 상품 표현(entities 후보)이 사용자 행위(features)를 알아, `entities → features` 금지 규칙을 어긴다. 조합 지점이 없다.
3. **`store-product` 한 슬라이스에 두 도메인.** 장바구니와 위시리스트가 한 폴더에 묶여 "위시리스트를 통째로 제거한다면"이라는 삭제 시나리오에서 한 도메인만 지울 수 없다(응집 실패).
4. **`types/commerce.ts` 통짜 타입 창고.** `Product / Category / CartItem / WishlistItem / HomeResponse / ProductListResponse / MockApiScenario` 가 한 파일에 있어 어느 슬라이스가 소유자인지 불분명하고, 어디로 옮기든 다른 도메인이 같은 파일에 엮여 결합이 생긴다.
5. **`app/products/page.tsx` 비대.** UI 렌더·필터 폼·페이지네이션·로딩/에러 분기·prefetch 로직이 한 파일에 몰려 라우팅 진입점 역할을 하지 못한다(현재 136줄).

### Before / After 폴더 트리

**Before (현재)**

```
src/
├── app/
│   ├── api/{_data/commerce.ts, home/route.ts, products/route.ts}  # mock 백엔드(유지)
│   ├── layout.tsx                # NuqsAdapter + QueryProvider 조합
│   ├── page.tsx                  # 홈 서버 prefetch
│   └── products/{page.tsx, products.hook.ts}  # 목록(UI+로직+prefetch 혼재)
├── components/{providers/QueryProvider, ui/(dialog,select)}        # 흩어진 shared
├── features/
│   ├── home/{api/queries, types, ui/HomeContent}                   # 사실상 entities+widget
│   ├── product/{api/queries, hooks/useProductListFilters, ui/ProductCard}  # entities+feature 섞임
│   └── store-product/{store/(cart,wishlist,migrate), ui/(Cart,Wishlist)Button}  # 두 도메인 한 슬라이스
├── hooks/useIsomorphicLayoutEffect.ts
├── lib/{fetcher, queryClient}
├── types/commerce.ts             # 통짜 도메인 타입
└── widgets/Header.tsx
```

**After (목표)**

```
src/
├── app/                          # 얇은 라우팅 진입점
│   ├── api/**                    # mock 백엔드(전환 제외)
│   ├── layout.tsx
│   ├── page.tsx                  # _pages/home 또는 widget 위임
│   ├── products/page.tsx         # _pages/products 또는 widget 위임
│   ├── loading.tsx / error.tsx   # route segment 경계
├── shared/                       # 도메인 지식 없음
│   ├── api/{fetcher, queryClient}
│   ├── lib/useIsomorphicLayoutEffect
│   ├── types/{ApiErrorResponse, MockApiScenario}  # 크로스커팅
│   └── ui/{dialog, select}       # 4주차 UI(위치만 이동)
├── entities/
│   └── product/{model, api/queries, ui/ProductCard}  # Product 타입 소유자(유일한 entity)
├── features/
│   ├── add-to-cart/{model/store, ui/CartButton}
│   ├── toggle-wishlist/{model/store, ui/WishlistButton}
│   └── product-filters/model/useProductListFilters  # nuqs URL 상태
├── widgets/
│   ├── header/Header                       # cart+wishlist 개수 selector
│   ├── product-card/ProductCard            # entities Card + features 버튼 조합
│   ├── product-list/ProductList            # 목록+필터 UI+페이지네이션+상태 분기
│   └── home/{api/queries, ui/HomeContent}  # 배너/카테고리/prefetch 조합(Home은 entity 아님)
└── _pages/{home, products}       # 필요 시 페이지 조합(옵션)
```

### 사용할 레이어만 선택한 근거

| 레이어      | 사용 | 근거                                                                                                                                                                                                              |
| ----------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app`       | O    | Next.js 라우팅 진입점. `page/layout/loading/error`만 얇게.                                                                                                                                                        |
| `widgets`   | O    | Header·ProductCard·ProductList·**Home**처럼 여러 slice를 한 화면 단위로 조합해야 한다. Home은 `HomeResponse`(banner+categories+products 집합)가 도메인 명사가 아니라 화면 조합이므로 entity가 아닌 widget에 둔다. |
| `features`  | O    | 장바구니 담기·위시리스트 토글·상품 필터처럼 "사용자 행위" 단위가 뚜렷하다.                                                                                                                                        |
| `entities`  | O    | **Product만.** 풍부한 형태·독자 정체성·다중 재사용을 갖춘 도메인 명사의 소유자. ProductCard 표현도 여기. Home은 조합(widget), banner는 재사용 전엔 widget 내부에 둔다.                                            |
| `shared`    | O    | fetcher·queryClient·hook·ui·크로스커팅 타입. 도메인 지식 없음.                                                                                                                                                    |
| `_pages`    | 옵션 | 페이지 조합이 커질 때만. 처음엔 `app/*.tsx`에서 widget을 직접 조합하고, 비대해지면 분리.                                                                                                                          |
| `processes` | X    | 사용 안 함. 비즈니스 파이프라인이 없다.                                                                                                                                                                           |

세그먼트는 `ui / model / api / lib / config`만 목적별로 사용. `components/hooks/types/utils` 같은 파일 종류 반복 금지, 빈 `index.ts`·미사용 폴더 생성 금지.

### 허용 / 금지 import 예시

```
허용(상위 → 하위 방향)
  widgets/product-card      → entities/product, features/add-to-cart, features/toggle-wishlist
  features/add-to-cart/ui   → entities/product/model  (Product 타입), shared
  app/products/page.tsx     → widgets/product-list, widgets/header

금지(역방향 / 횡단)
  entities/product/ui/ProductCard  → features/add-to-cart   (entities → features 역방향)
  features/add-to-cart             → features/toggle-wishlist (같은 레이어 다른 slice 횡단)
  shared                           → entities/features       (하위 → 상위)
```

`entities/product/ui/ProductCard`는 행위 버튼을 직접 import 하지 않고 **`actions?: ReactNode` 슬롯**으로 받는다. 조합은 `widgets/product-card`에서.

### 단계별 마이그레이션 계획과 검증 방법

| 단계 | 작업                                                                                                                                                              | 검증                             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1    | `shared` 구성: `lib/`, `api/`, `hooks→lib`, `components/ui→shared/ui`. 크로스커팅 타입(`ApiErrorResponse`, `MockApiScenario`) 이동.                               | `pnpm check` + 홈/목록 동작 동일 |
| 2    | `types/commerce.ts` 분해: `Product/Category/...` → `entities/product/model`, `HomeResponse` → `widgets/home/model`, `CartItem/WishlistItem` → 각 feature `model`. | 타입 검사 통과                   |
| 3    | `entities/product` + `widgets/home` 구성. api 쿼리 팩토리 이동.                                                                                                   | query key 동일(캐시 적중)        |
| 4    | `features` 3개 분리: `add-to-cart`, `toggle-wishlist`, `product-filters`. `store-product` 폴더 제거.                                                              | 헤더 개수·동기화 동일            |
| 5    | `ProductCard` 역방향 의존 제거(slot化) + `widgets/{product-card,product-list,home,header}` 조합.                                                                  | 역방향 import 없음(grep)         |
| 6    | `app/*.tsx` 얇은 진입점 정리 + `loading.tsx`/`error.tsx` 추가.                                                                                                    | 라우트 경계 동작                 |
| 7    | 삭제 시나리오·에러 재현 검증.                                                                                                                                     | 5단계 사고 실험 통과             |

---

## D — Data Model

### 상태 분류표 (5주차 표를 새 구조로 갱신)

| 상태                  | Source of Truth       | 소유 슬라이스/레이어                       | 소비하는 곳        | 이동 후에도 중복 저장하지 않는 방법                                              |
| --------------------- | --------------------- | ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------- |
| 상품 조회 결과        | 서버 / TanStack Query | `entities/product/api`, `widgets/home/api` | 홈, 상품 목록      | 캐시만 단일 저장. Zustand에 복사 금지. `ProductCard`는 `product` prop만 받음.    |
| 검색·정렬·페이지      | URL / nuqs            | `features/product-filters/model`           | 상품 목록(widget)  | URL이 단일 원본. 별도 `useState`로 query 동기화 금지(기존 debounce 초안만 로컬). |
| 장바구니              | Zustand persist       | `features/add-to-cart/model`               | 헤더, 상품 행위 UI | store만 저장. 헤더 개수는 `useCartCount` 파생(별도 저장 X).                      |
| 위시리스트            | Zustand persist       | `features/toggle-wishlist/model`           | 헤더, 상품 행위 UI | 위와 동일. `useWishlistCount` 파생.                                              |
| Dialog 열림·입력 초안 | React 로컬 상태       | 해당 UI 컴포넌트 내부                      | 해당 UI            | 전역으로 올리지 않음. 컴포넌트 수명에서만.                                       |

> 폴더를 옮기면서 서버 응답을 Zustand에 복사하거나 URL 상태를 `useState`에 동기화하지 않는다. 기존 `products.hook.ts`의 `searchInput`은 URL `q`의 **입력 초안(debounce 대기)** 이므로 로컬 상태로 유지(이중 저장 아님).

### 파일 매핑표

| 현재 위치                                                   | 목표 위치                                                     | 레이어/슬라이스/세그먼트       | 이동 또는 유지하는 이유                  |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| `src/lib/fetcher.ts`                                        | `src/shared/api/fetcher.ts`                                   | shared/api                     | 도메인 없는 HTTP 유틸                    |
| `src/lib/queryClient.ts`                                    | `src/shared/api/queryClient.ts`                               | shared/api                     | QueryClient 팩토리                       |
| `src/hooks/useIsomorphicLayoutEffect.ts`                    | `src/shared/lib/useIsomorphicLayoutEffect.ts`                 | shared/lib                     | 범용 SSR hook                            |
| `src/components/providers/QueryProvider.tsx`                | `src/shared/api/QueryProvider.tsx`                            | shared/api                     | 전역 Provider                            |
| `src/components/ui/{dialog,select}`                         | `src/shared/ui/{dialog,select}`                               | shared/ui                      | 4주차 범용 UI                            |
| `src/types/commerce.ts` 중 Product 계열                     | `src/entities/product/model/index.ts`                         | entities/product/model         | Product 소유자                           |
| `src/types/commerce.ts` 중 HomeResponse                     | `src/widgets/home/model/index.ts`                             | widgets/home/model             | 도메인 명사 아닌 화면 집합 → widget 소유 |
| `src/types/commerce.ts` 중 CartItem/WishlistItem            | 각 feature `model/index.ts`                                   | features/*/model               | 행위가 소유                              |
| `src/types/commerce.ts` 중 ApiErrorResponse/MockApiScenario | `src/shared/types/api.ts`                                     | shared/types                   | 크로스커팅                               |
| `src/features/product/api/queries.ts`                       | `src/entities/product/api/queries.ts`                         | entities/product/api           | 여러 페이지 재사용                       |
| `src/features/home/api/queries.ts`                          | `src/widgets/home/api/queries.ts`                             | widgets/home/api               | 홈 화면 전용 조회 → widget이 소유        |
| `src/features/product/ui/ProductCard.tsx`                   | `src/entities/product/ui/ProductCard.tsx`                     | entities/product/ui            | 표현. 단 slot化로 버튼 import 제거       |
| `src/features/product/hooks/useProductListFilters.ts`       | `src/features/product-filters/model/useProductListFilters.ts` | features/product-filters/model | 사용자 행위(조작)                        |
| `src/features/store-product/store/cart.ts`                  | `src/features/add-to-cart/model/store.ts`                     | features/add-to-cart/model     | 행위·상태 경계                           |
| `src/features/store-product/ui/CartButton.tsx`              | `src/features/add-to-cart/ui/CartButton.tsx`                  | features/add-to-cart/ui        | 행위 UI                                  |
| `src/features/store-product/store/wishlist.ts`              | `src/features/toggle-wishlist/model/store.ts`                 | features/toggle-wishlist/model | 행위·상태 경계                           |
| `src/features/store-product/ui/WishlistButton.tsx`          | `src/features/toggle-wishlist/ui/WishlistButton.tsx`          | features/toggle-wishlist/ui    | 행위 UI                                  |
| `src/features/store-product/store/migrate.ts`               | `src/shared/lib/validateStoredItems.ts`                       | shared/lib                     | 도메인 무관 순수 검증(제네릭화)          |
| `src/features/home/types.ts`                                | `src/widgets/home/model/index.ts`에 흡수                      | widgets/home/model             | 단일 타입이라 병합                       |
| `src/features/home/ui/HomeContent.tsx`                      | `src/widgets/home/HomeContent.tsx`                            | widgets/home                   | 배너/카테고리/prefetch 조합              |
| `src/widgets/Header.tsx`                                    | `src/widgets/header/Header.tsx`                               | widgets/header                 | 폴더 정규화                              |
| `src/app/products/products.hook.ts`                         | `src/widgets/product-list/model/useProductPage.ts`            | widgets/product-list/model     | 페이지 조합 로직                         |
| `src/app/products/page.tsx`                                 | `src/app/products/page.tsx`(얇게) + 위임                      | app + widgets/product-list     | 진입점은 조합만                          |
| `src/app/page.tsx`                                          | `src/app/page.tsx`(유지, 얇게)                                | app                            | 서버 prefetch 진입점                     |
| `src/app/api/**`                                            | **유지**                                                      | app/api                        | mock 백엔드, 전환 제외                   |

### 애매한 파일 결정표

| 대상                                  | 후보 A                     | 후보 B                           | 최종 결정                                                                    | 기준                                                                                                                            |
| ------------------------------------- | -------------------------- | -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ProductCard`                         | `entities/product/ui`      | `widgets/product-card`           | **둘 다**: 표현은 `entities/product/ui`(slot), 조합은 `widgets/product-card` | 표현(도메인)과 행위(조합) 분리. entities가 features를 모르게                                                                    |
| 상품 목록 `productQueries`            | `entities/product/api`     | 목록 페이지 `api`                | **`entities/product/api`**                                                   | 홈 카테고리 prefetch가 재사용                                                                                                   |
| 장바구니 store                        | `entities/cart/model`      | `features/add-to-cart/model`     | **`features/add-to-cart/model`**                                             | 장바구니는 행위 중심, 도메인 엔티티(Product)는 별도. 행위 경계                                                                  |
| `useProductListFilters`(nuqs)         | `entities/product/model`   | `features/product-filters/model` | **`features/product-filters`**                                               | 한 페이지에서만 쓰더라도 "사용자 조작" = 행위. page 수준에서만 쓰면 widget 내부 model로                                         |
| `Product` 타입                        | `entities/product/model`   | `shared/types` 유지              | **`entities/product/model`**                                                 | 도메인 타입의 소유자 명확화. shared에 두면 모든 도메인이 한 창고에 결합                                                         |
| 홈 조회(`homeQueries`/`HomeResponse`) | `entities/home`            | `widgets/home`                   | **`widgets/home`**                                                           | `HomeResponse`는 banner+categories+products 집합(독자 정체성 없음), 홈 화면 1곳만 사용. Product(entity)와 달리 도메인 명사 아님 |
| `migrate.ts`(cart/wishlist 공용)      | 각 feature `model` 중복    | `shared/lib`                     | **`shared/lib`**                                                             | 도메인 무관 순수 검증 로직. 제네릭으로 공용                                                                                     |
| 홈 prefetch 로직(`app/page.tsx`)      | `app/page.tsx` 유지        | `_pages/home`                    | **`app/page.tsx` 유지**                                                      | 서버 컴포넌트 prefetch는 라우팅 진입점에 두는 게 자연스러움                                                                     |
| 4주차 `dialog/select`                 | `shared/ui`                | `entities/*/ui`                  | **`shared/ui`**                                                              | 특정 도메인 종속 없는 범용 UI                                                                                                   |
| `products.hook.ts`(debounce)          | `features/product-filters` | `widgets/product-list/model`     | **`widgets/product-list/model`**                                             | 필터 값 자체는 feature지만, debounce+렌더 조합은 widget 페이지 단위                                                             |

---

## I — Interface

### 각 슬라이스가 공개할 값과 숨길 구현 세부

| 슬라이스                   | 공개(Public)                                                                        | 숨김(내부 구현)                                      |
| -------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `entities/product`         | `Product` 타입, `productQueries`, `ProductCard`(slot), `DEFAULT_PRODUCT_LIST_QUERY` | fetch 구현, 쿼리 키 내부 구조, 카드 마크업           |
| `widgets/home`             | `HomeContent`, `homeQueries`, `HomeResponse`                                        | fetch 구현, 배너/카테고리 매핑 내부                  |
| `features/add-to-cart`     | `CartButton`, `useCartCount`, `useIsInCart`, `useCartHasHydrated`, `useCartStore`   | persist storage key, migrate 내부, `items` 원본 배열 |
| `features/toggle-wishlist` | `WishlistButton`, `useWishlistCount`, `useIsInWishlist`, `useWishlistHasHydrated`   | 위와 대칭                                            |
| `features/product-filters` | `useProductListFilters`, `PAGE_SIZE`, 타입 가드                                     | nuqs parser 내부                                     |
| `widgets/*`                | 조합 컴포넌트                                                                       | 내부 하위 컴포넌트                                   |
| `shared/*`                 | 범용 함수·타입·UI                                                                   | —                                                    |

### `ProductCard`와 장바구니·위시리스트 행위의 조합 방법

`entities/product/ui/ProductCard`는 `actions?: ReactNode` 슬롯만 노출하고 버튼을 모른다.

```tsx
// entities/product/ui/ProductCard.tsx — 행위 import 없음
export const ProductCard = ({ product, actions }: { product: Product; actions?: ReactNode }) => (
  <article className="product">
    {/* 이미지·이름·가격 */}
    {actions && <div className="actions">{actions}</div>}
  </article>
);
```

```tsx
// widgets/product-card/ProductCard.tsx — 조합 지점(상위가 하위를 안다)
import { ProductCard as ProductCardView } from '@/entities/product/ui/ProductCard';
import { CartButton } from '@/features/add-to-cart/ui/CartButton';
import { WishlistButton } from '@/features/toggle-wishlist/ui/WishlistButton';

export const ProductCard = ({ product }: { product: Product }) => (
  <ProductCardView
    product={product}
    actions={
      <>
        <WishlistButton product={product} />
        <CartButton product={product} />
      </>
    }
  />
);
```

이로써 `entities → features` 역방향 import가 사라진다. 위시리스트 제거 시 `widgets/product-card`의 actions만 바꾸면 된다.

### Public API 사용 여부와 방식

- **barrel file(습관적 `export *`)은 만들지 않는다.** 이름 충돌·순환 의존·번들 비용만 남는다.
- **Public API는 선택적 적용.** 외부에 노출할 계약이 명확한 슬라이스(`entities/product`, `features/add-to-cart`, `features/toggle-wishlist`)에만 루트 `index.ts`를 두고 **명시적 이름만 재export** 한다.
- 범용 유틸·단일 파일 슬라이스는 `index.ts` 없이 경로 직접 import. 빈 `index.ts` 금지.
- `@/*` path alias를 유지하되, 내부 세그먼트까지 깊은 경로보다 슬라이스 루트(Public API) 경로를 우선 import.

---

## O — Optimization

### TanStack Query 캐시 정책 유지/변경 근거

| 쿼리                       | 정책                                                   | 근거                                            | 이번 주 변경                      |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------- | --------------------------------- |
| 홈 `homeQueries.home`      | staleTime 기본 60s, retry 1                            | 상품 품절/가격 변동 고려, 1분 fresh             | **유지**                          |
| 목록 `productQueries.list` | staleTime 30s, gcTime 5m, `keepPreviousData`           | 필터/페이지 잦은 변경, 앞뒤 이동 캐시 즉시 노출 | **유지**                          |
| 홈 서버 prefetch           | 요청마다 QueryClient + `dehydrate`/`HydrationBoundary` | 첫 페인트부터 상품, 스피너 제거 LCP 개선        | **유지**(구조만 `app/page.tsx`에) |

> 캐시 정책은 폴더 이동으로 바뀌지 않는다. query key 배열 구조(`['home', scenario]`, `['products', 'list', query]`)를 그대로 유지해 캐시 적중을 보존한다.

### 로딩·에러 경계 범위

| 실패 유형                   | 처리 위치                                   | Error Boundary 전파 | 사용자 UI                 | 재시도               | 이유                                                  |
| --------------------------- | ------------------------------------------- | ------------------- | ------------------------- | -------------------- | ----------------------------------------------------- |
| 조회 실패(5xx) — 홈·목록    | `app/error.tsx`(전역)                       | O(`throwOnError`)   | 페이지 fallback + `reset` | reset 재렌더(재요청) | 서버 잘못이라 사용자가 로컬에서 회복 불가 → 전역 경계 |
| 잘못된 검색 조건(4xx)       | 인라인(widget)                              | X                   | 빈 결과/안내 메시지       | 조건 수정            | 사용자가 입력을 고쳐 그 자리에서 회복 가능            |
| 빈 결과                     | 인라인(widget)                              | X                   | "검색 결과가 없습니다."   | 조건 수정            | 정상 흐름의 결과                                      |
| 예상 밖 렌더링 오류         | `app/error.tsx`(전역)                       | O                   | fallback + `reset`        | reset 재렌더         | 인라인 처리 자체가 불가능한 크래시                    |
| 장바구니 행위 비즈니스 오류 | 해당 없음(현재 동기 toggle, 실패 경로 없음) | —                   | —                         | —                    | 향후 서버 동기화 생기면 feature 내 인라인             |

- **전파 기준 = "사용자가 그 화면 안에서 스스로 회복할 수 있는가?"** 회복 가능(4xx·빈)은 인라인, 회복 불가(5xx·렌더 크래시)는 전역 `error.tsx`. 위 표의 "전파" 열과 일치.
- `throwOnError: (err) => err instanceof ApiError && err.status >= 500` — 5xx만 렌더 중 throw → `error.tsx`가 포착. 4xx·빈 결과는 throw 안 함 → `isError`로 widget 안에서 인라인.
- `error.tsx`의 `reset`이 재렌더(→재요청)를 제공하므로, 5xx도 "다시 시도" 경험을 잃지 않음. 인라인이어야만 재시도되는 건 아님.
- `loading.tsx`는 route 단위 스켈레톤, Query `isPending`은 데이터 영역 스피너. 목록은 `keepPreviousData`로 로딩을 숨기므로 route `loading.tsx`는 홈 진입에만 주로 의미.
- Error Boundary는 이벤트 핸들러·비동기 콜백 오류를 잡지 못함. toggle 같은 핸들러 오류는 feature 내 try/catch로 처리(현재는 동기라 해당 없음).
- `ApiError`(HTTP status 보유)를 공용 에러 타입으로 유지. `shared`에 화면 문구를 두지 않는다.

### 이번 주에 하지 않을 최적화

- 쿼리 별 `retry` 세분화·`refetchOnReconnect` 튜닝 (현재 기본값으로 충분, 과최적화)
  -Suspense 전환·`useTransition` 페이지 전환 최적화 (구조 안정화가 먼저)
- 이미지 `priority`/lazy 튜닝 (4주차 UI 유지 범위)

---

## 5단계 — 삭제 시나리오 자가 검증 (예측, 마이그레이션 후 확정)

### "위시리스트 기능을 통째로 제거한다면"

예상 삭제 대상(한 슬라이스에 응집 예상):

- `src/features/toggle-wishlist/` 전체(`model/store.ts`, `ui/WishlistButton.tsx`)

예상 수정 대상:

- `src/widgets/product-card/ProductCard.tsx` — actions에서 `<WishlistButton/>` 제거
- `src/widgets/header/Header.tsx` — `useWishlistCount` 호출·표시 제거
- persist storage 마이그레이션(선택)

> grep 없이 세 곳만 보면 된다면 응집 성공. 현재 구조(`store-product`에 cart와 섞임)에서는 불가능했던 분리.

### "신상품 뱃지를 상품 카드에 추가한다면"

예상 터치 파일:

- `src/entities/product/ui/ProductCard.tsx` — `createdAt` 기반 뱃지 렌더 추가(데이터는 이미 `Product`에 있음)

> 1개 파일. `Product` 타입에 필드가 이미 있으므로 추가 없음. 자신 있게 예측 가능하면 경계 설계 양호.

---

## FSD 이해 확인 (핵심 질문)

1. **`ProductCard`가 찜 버튼을 직접 import하면?** `entities → features` 역방향 의존 위반. 상품 표현과 행위는 `widgets/product-card`에서 `actions` slot으로 조합한다.
2. **한 페이지에서만 쓰는 검색 로직도 feature여야 하는가?** 아니오. 내 프로젝트에서는 debounce+렌더 조합은 `widgets/product-list/model`에, nuqs 값 자체는 `features/product-filters`에 뒀다. "사용자 행위" 단위가 뚜렷할 때만 feature.
3. **`formatPrice`는 항상 `shared/lib`인가?** 아니오. 통화/회원등급/상품정책이 들어가면 `entities/product/lib` 또는 별도 도메인으로 옮긴다. 순수 포맷만 `shared/lib`.
4. **두 feature가 협력할 때?** 직접 import 대신 `widgets`에서 조합. Header가 cart+wishlist 개수를 함께 쓰는 식.
5. **폴더 이동 후에도 TanStack/Zustand 데이터를 복사하지 않는 이유?** Source of Truth는 하나. 복사하면 동기화 비용·불일치만 생긴다. 헤더 개수는 store에서 파생.
6. **barrel vs Public API?** barrel은 경로 단축용 습관적 재export. Public API는 "외부가 알아도 되는 것은 이것뿐" 계약. 나는 명시적 이름만 재export하는 Public API를 선택 슬라이스에만 적용.
