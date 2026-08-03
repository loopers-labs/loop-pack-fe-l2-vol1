# RFC — 6주차 FSD 전환

| 항목      | 내용                                                                                        |
| --------- | ------------------------------------------------------------------------------------------- |
| 상태      | 초안 (마이그레이션 착수 전)                                                                 |
| 대상      | `src/**` (단, `src/app/api/**` mock 백엔드 제외)                                            |
| 기준 커밋 | `1f35fc3`                                                                                   |
| 원칙      | 이 문서는 **파일을 옮기기 전에** 커밋한다. 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다. |

---

## 0. 동작 기준선

폴더를 옮기기 전에 고정하려던 기준선.

**⚠️ 이 표는 계획대로 채워지지 못했다.** 착수 전에 확인한 것은 `pnpm check` 하나뿐이고, 화면 동작 7개는 ⬜인 채로 마이그레이션에 들어갔다. 전환 전 코드는 이제 git 이력에만 있으므로 **사후에 이 칸을 채울 방법이 없다.** 아래 "전환 후 동작 확인"에 실제로 확인한 것을 따로 적는다.

| 항목                                           | 착수 전 확인 | 비고                                                                        |
| ---------------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `pnpm check` (test → lint → typecheck → build) | ✅ 통과      | exit 0. 빌드 라우트: `/`, `/products`, `/api/home`, `/api/products`         |
| 홈 — 정상                                      | ❌ 미확인    | 배너 · 카테고리 · 인기상품 · 신상품 렌더                                    |
| 홈 — 로딩 / 에러 / 빈 상태                     | ❌ 미확인    | 당시 `HomeSection`(현 `HomePageBoundary`)의 Suspense · ErrorBoundary        |
| 목록 — 정상 / 로딩 / 에러 / 빈 상태            | ❌ 미확인    | 당시 `ProductListView`(현 `ProductListPage`)의 결과 전용 경계               |
| 검색 · 카테고리 · 정렬 · 페이지네이션          | ❌ 미확인    | 조건 변경 시 `page`가 1로 리셋되는지 포함                                   |
| URL 공유 · 새로고침 · 뒤로/앞으로              | ❌ 미확인    | nuqs `history: 'push'`                                                      |
| 홈 ↔ 목록 장바구니 · 위시리스트 동기화         | ❌ 미확인    | 같은 상품을 홈에서 담고 목록에서 담김 상태로 보이는지                       |
| 페이지 이동 중 Zustand 상태 · 헤더 개수 유지   | ❌ 미확인    | 당시 `persist` key `commerce-store`(현 `commerce-cart`/`commerce-wishlist`) |

**이게 이번 과제에서 가장 큰 절차상 구멍이다.** 과제 0단계가 "폴더를 옮기기 전에 아래 동작을 직접 확인하고 RFC에 결과를 남깁니다"라고 명시했는데 지키지 않았다. 회귀 판정을 `pnpm check` 통과에 의존했고, 빌드 통과는 동작 보존의 증거가 아니다. 전환 후 확인에서 문제가 안 나온 것은 결과가 좋았던 것이지 절차가 옳았던 것이 아니다.

### 전환 후 동작 확인

기준선이 없으므로 **"전환 전과 같은가"가 아니라 "지금 요구대로 동작하는가"** 를 확인했다. 회귀를 잡는 힘은 기준선을 남겼을 때보다 약하다.

| 항목                                         | 결과             |
| -------------------------------------------- | ---------------- |
| `pnpm check`                                 | ✅ exit 0 (실측) |
| 홈 — 정상 / 로딩 / 에러 / 빈 상태            | ✅ 사용자 확인   |
| 목록 — 정상 / 로딩 / 에러 / 빈 상태          | ✅ 사용자 확인   |
| 검색 · 카테고리 · 정렬 · 페이지네이션        | ✅ 사용자 확인   |
| URL 공유 · 새로고침 · 뒤로/앞으로            | ✅ 사용자 확인   |
| 홈 ↔ 목록 장바구니 · 위시리스트 동기화       | ✅ 사용자 확인   |
| 페이지 이동 중 Zustand 상태 · 헤더 개수 유지 | ✅ 사용자 확인   |
| 4단계 에러 경계 재현 5종 (아래 표)           | ✅ 사용자 확인   |
| 조건 초기화 버튼 (Advanced B)                | ✅ 사용자 확인   |

> `✅ 사용자 확인` 은 브라우저에서 직접 눌러 본 결과다. `pnpm check` 만 도구로 측정한 값이다.

**리팩토링 중 발견한 기존 버그**: 발견하면 아래 형식으로 커밋과 기록을 따로 남긴다.
`재현 방법 · 원인 · 수정 위치 · 검증 결과`

---

## R — Requirements

### 보존해야 하는 기능 요구사항

- 홈: 배너, 카테고리 링크, 인기 상품, 신상품 목록
- 상품 목록: 검색어 · 카테고리 · 정렬 · 페이지네이션
- 장바구니 · 위시리스트 토글, 헤더의 개수 표시
- 홈과 목록에서 담김/찜 상태가 동일하게 보임

### 보존해야 하는 비기능 요구사항

| 요구사항                 | 현재 보장 방식                                           | 이동 후에도 유지해야 하는 것                |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------- |
| 조건의 공유·복원         | nuqs URL 상태 (`history: 'push'`)                        | URL이 검색 조건의 유일한 원본               |
| 홈 초기 렌더 속도        | 서버 `prefetchQuery` → `dehydrate` → `HydrationBoundary` | `queryKey` 동일성 (`['home']`)              |
| 목록 전환 시 깜빡임 없음 | `placeholderData: keepPreviousData`                      | `queryKey: ['products', query]` 구조        |
| 필터 폼 생존             | 결과 영역만 Suspense/ErrorBoundary로 감쌈                | 경계 위치가 폼 바깥으로 올라가지 않을 것    |
| 헤더 리렌더 최소화       | `Header`가 개수만 selector 구독                          | 파생값(`length`)을 store에 저장하지 않을 것 |
| 새로고침 후 담김 상태    | zustand `persist`                                        | persist key 변경 시 데이터 호환 결정 필요   |

### 이번 주에 **하지 않을 것**과 근거

| 하지 않을 것                               | 근거                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 데모 · 예제 코드의 FSD 전환                | `*-demo.tsx → @/services/useProductOptions → services/products.ts` 와 `examples/`는 어떤 라우트에서도 도달하지 않는 고아 묶음이다. 커머스 본류가 아닌데 `shared`로 끌고 오면 "외부에 공개할 것"의 경계가 데모로 지저분해진다. 현 위치에 그대로 둔다.                                                          |
| 데모 파일 삭제                             | 데모 5개와 그 부품을 걷어내면 select의 floating 계열(`useSelectFloating.ts`, `chevron.tsx`, `select/util.ts`)이 유일한 importer를 잃고 함께 죽는다. 4주차 산출물이라 리팩토링 커밋에서 판단할 일이 아니다. 정리는 나중에 따로 한다.                                                                           |
| `src/app/api/**` (mock 백엔드) 이동        | 프론트엔드와 mock 백엔드의 경계. Route Handler는 Next 라우팅 규약에 묶여 있어 FSD 레이어로 옮길 수 없다.                                                                                                                                                                                                      |
| `week-05-layout.css` 전역 클래스 결합 해소 | `week05-*` 전역 클래스명을 쓰는 파일이 8개다(`layout.tsx`, `page.tsx`, `Header`, `ProductCard`, `HomeView`, `HomeSection`, `ProductList`, `ProductListView`). 슬라이스를 옮겨도 이 결합은 남는다. 푸는 건 구조 변경이 아니라 스타일 방식 변경이라, 손대면 이번 커밋과 실패 원인이 섞인다. 부채로 적어만 둔다. |
| `_app` 레이어                              | 아래 "레이어 선택 근거" 참조.                                                                                                                                                                                                                                                                                 |

---

## A — Architecture

### A-1. 현재 구조에서 실제로 겪는 문제

**① 상품 목록 기능 하나가 6개 폴더에 흩어져 있다**

```
app/(shop)/products/_components/ProductList.tsx      결과 렌더
app/(shop)/products/_components/ProductListView.tsx  필터 폼 + 경계
app/(shop)/products/_hooks/useProductListQuery.ts    URL 상태
app/(shop)/products/_constants.ts                    필터 옵션 SSOT
services/queries/products.ts                         queryOptions
api/commerce.ts                                      fetchProducts
utils/toSearchQueryParams.ts                         쿼리스트링 변환
types/commerce.ts                                    ProductListQuery
```

"정렬 옵션을 하나 추가한다"에 몇 개 폴더를 열어야 하는지 즉답할 수 없다.

**② `types/commerce.ts` 한 파일이 8개 파일의 공통 의존점이다**

`Product` 필드를 하나 바꾸면 홈, 목록, API 함수, store가 전부 딸려 온다. 게다가 이 파일 안의 `CategoryId`, `MockApiScenario`, `ApiErrorResponse`, `ProductListQuery`는 소유자가 제각각인데 한자리에 뭉쳐 있다.

**③ `ProductCard`가 스토어를 직접 구독한다** — `src/app/(shop)/_components/ProductCard.tsx:12-15`

상품 "표현"이 장바구니·위시리스트 "행위"를 알고 있다. 이 파일을 그대로 `entities/product/ui`로 옮기면 즉시 `entities → features` 역방향 의존이 된다. **이 파일은 위치를 옮기기 전에 구조를 바꿔야 하는 유일한 파일이다.**

**④ `api/commerce.ts` 한 파일이 두 도메인을 담당한다** — `fetchHome`(홈 조회)과 `fetchProducts`(상품 목록)가 한 모듈에 있다. 홈 응답 스펙 변경이 상품 목록 코드와 같은 파일에서 일어난다.

**⑤ 최상위 폴더가 전부 "파일 종류" 기준이다** — `api / services / components / hooks / utils / lib / store / types`. 어떤 폴더도 "이건 무슨 기능인가"에 답하지 못한다. 과제가 하지 말라고 못 박은 네이밍이다.

**⑥ `apiClient.get`이 HTTP status를 버린다** — `src/api/apiClient.ts:38-46`

```ts
return Promise.reject(new Error(message)); // status 소실
```

실패가 전부 똑같은 `Error`로 뭉개져서 4xx와 5xx를 갈라낼 방법이 없다. 4단계의 "5xx는 경계로, 4xx는 인라인" 기준은 이 코드 위에서 구현이 안 된다. 그래서 4단계 선행 조건으로 등록한다.

**⑦ 에러 경계는 있으나 전파 기준이 없다** — `ProductList.tsx:28`의 `throwOnError: true`는 4xx든 5xx든 가리지 않고 전부 경계로 던진다. route `error.tsx`와 `loading.tsx`는 프로젝트에 하나도 없다.

### A-2. 현재 폴더 트리 (Before)

```
src/
├─ api/
│  ├─ apiClient.ts                       공통 fetch 래퍼 (GET only)
│  └─ commerce.ts                        fetchHome + fetchProducts
├─ app/
│  ├─ layout.tsx / providers.tsx / globals.css / week-05-layout.css
│  ├─ api/                               mock 백엔드 (범위 외)
│  └─ (shop)/
│     ├─ layout.tsx
│     ├─ page.tsx
│     ├─ _components/{Header,HomeSection,HomeView,ProductCard}.tsx
│     └─ products/
│        ├─ page.tsx
│        ├─ _constants.ts
│        ├─ _hooks/useProductListQuery.ts
│        └─ _components/{ProductList,ProductListView}.tsx
├─ components/ui/{dialog,select}/        4주차 산출물 — 커머스에서 미사용
│  └─ **/components/*-demo.tsx           ← 고아 (importer 0)
├─ examples/week-05-layout/              ← 고아
├─ lib/query/get-query-client.ts
├─ services/
│  ├─ queries/{home,products}.ts
│  ├─ products.ts                        ← 데모 전용
│  └─ useProductOptions.ts               ← 데모 전용
├─ store/useCommerceStore.ts             cart + wishlist 한 파일
├─ types/commerce.ts                     8개 파일이 의존
└─ utils/toSearchQueryParams.ts
```

### A-3. 목표 폴더 트리 (After)

```
src/
├─ app/                                  Next.js 라우팅 전용 — FSD 레이어 아님
│  ├─ layout.tsx                         root layout + <Providers>
│  ├─ providers.tsx                      QueryClientProvider + NuqsAdapter
│  ├─ globals.css / week-05-layout.css
│  ├─ api/                               mock 백엔드 (범위 외)
│  └─ (shop)/
│     ├─ layout.tsx                      widgets/header 렌더
│     ├─ page.tsx                        _pages/home 진입점 (prefetch + Hydration)
│     ├─ error.tsx                       [신규 · 4단계]
│     └─ products/
│        ├─ page.tsx                     _pages/product-list 진입점
│        └─ error.tsx                    [신규 · 4단계]
│
├─ _pages/
│  ├─ home/
│  │  ├─ api/homeQueries.ts
│  │  ├─ model/types.ts                  HomeResponse, Banner
│  │  ├─ ui/HomePage.tsx                 ← HomeView
│  │  └─ ui/HomePageBoundary.tsx         ← HomeSection
│  └─ product-list/
│     ├─ api/productListQueries.ts
│     ├─ api/productListRequest.ts       ← utils/toSearchQueryParams.ts (아래 근거 참조)
│     │                                    백엔드 계약: 경로 + 파라미터 매핑 + 응답 타입
│     ├─ model/types.ts                  ProductListQuery, ProductListResponse
│     ├─ ui/ProductListPage.tsx          ← ProductListView (필터 폼을 뺀 조합·경계)
│     └─ ui/ProductListResult.tsx        ← ProductList
│
├─ widgets/
│  └─ header/
│     ├─ ui/Header.tsx
│     └─ index.ts                        Public API
│
├─ features/
│  ├─ add-to-cart/
│  │  ├─ ui/AddToCartButton.tsx
│  │  └─ index.ts
│  ├─ toggle-wishlist/
│  │  ├─ ui/WishlistToggleButton.tsx
│  │  └─ index.ts
│  └─ product-filter/                    ← S6b 에서 승격 (아래 결정표 #6)
│     ├─ ui/ProductFilterForm.tsx        ← ProductListView 의 폼 부분
│     ├─ model/useProductFilterState.ts  ← _hooks/useProductListQuery.ts
│     ├─ config/filters.ts               ← _constants.ts
│     └─ index.ts
│
├─ entities/
│  ├─ product/
│  │  ├─ model/product.ts                Product, Category, CategoryId, ProductSort
│  │  ├─ ui/ProductCard.tsx              actions 슬롯 (store 의존 제거)
│  │  └─ index.ts
│  ├─ cart/
│  │  ├─ model/useCartStore.ts
│  │  └─ index.ts
│  └─ wishlist/
│     ├─ model/useWishlistStore.ts
│     └─ index.ts
│
└─ shared/
   ├─ api/apiClient.ts
   ├─ api/httpError.ts                   [신규 · 4단계] status 보존
   ├─ api/queryClient.ts                 ← lib/query/get-query-client.ts
   └─ ui/{dialog,select}/                ← components/ui/ (shared 단계에서 확정)

(전환 범위 제외 — 현 위치 유지)
   src/examples/week-05-layout/
   src/services/{products.ts,useProductOptions.ts}
   src/components/ui/**/components/*-demo.tsx   ※ shared/ui 이동 시 폴더째 따라옴
```

### A-4. 레이어 선택 근거 — 만드는 것과 만들지 않는 것

| 레이어     | 사용       | 근거                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared`   | ✅         | `apiClient`, `queryClient`는 어떤 도메인도 모르는 인프라다. 아는 도메인이 하나도 없는 코드에도 자리가 있어야 한다.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `entities` | ✅         | `product`, `cart`, `wishlist` 세 도메인이 실제로 존재하고, 각각 두 곳 이상에서 소비된다.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `features` | ✅         | "장바구니에 담기"와 "찜 토글"은 사용자 행위다. `ProductCard`에서 이 행위를 떼어내야 역방향 의존이 사라지는데, 떼어낸 걸 담을 자리가 있어야 한다.                                                                                                                                                                                                                                                                                                                                                                              |
| `widgets`  | ✅         | `Header`는 `cart`와 `wishlist` 두 엔티티를 조합하고 홈과 목록 양쪽에서 쓰인다. 어느 한 페이지에도 속하지 않으니 page 레이어에는 못 둔다.                                                                                                                                                                                                                                                                                                                                                                                      |
| `_pages`   | ✅         | 홈과 목록 각각 데이터 조회, 로딩·에러 경계, 뷰 조합까지 실제로 조합할 게 있다. 이걸 전부 Next의 `page.tsx`에 넣으면 라우팅 진입점이 얇아지질 않는다.                                                                                                                                                                                                                                                                                                                                                                          |
| `_app`     | ❌ 안 만듦 | `Providers`(QueryClient + Nuqs), 폰트, 메타데이터, 전역 CSS를 Next의 root `layout.tsx`가 이미 전부 맡고 있다. `_app`을 만들어봐야 `layout.tsx`가 `_app`을 부르는 한 줄짜리 위임만 남고, 거쳐 가는 층만 하나 는다. 필요 없는 레이어를 안 만드는 것도 설계라는 말을 여기에 적용했다.<br>**전환 트리거**: `layout.tsx`가 provider 배선을 넘어 조합을 시작할 때. 전역 토스트 컨테이너, 분석 초기화, 인증 게이트, 실험군 분기가 붙으면 라우팅 진입점이 아니라 앱 조립 지점이 된다. 지금은 17줄에 폰트와 Providers뿐이라 아직 멀다. |

**세그먼트 원칙**: `ui / model / api / lib / config`만 쓴다. `components / hooks / types / utils`는 만들지 않는다. 빈 폴더와 소비자 없는 `index.ts`도 만들지 않는다.

### A-5. 허용 / 금지 import 예시

의존 방향: `app → _pages → widgets → features → entities → shared`

**허용 ✅**

```ts
// _pages/product-list/ui/ProductListPage.tsx
import { ProductCard } from '@/entities/product';        // _pages → entities
import { AddToCartButton } from '@/features/add-to-cart'; // _pages → features

// widgets/header/ui/Header.tsx
import { useCartStore } from '@/entities/cart';           // widgets → entities
import { useWishlistStore } from '@/entities/wishlist';   // widgets → entities (서로 다른 하위 슬라이스 조합은 상위의 역할)

// features/add-to-cart/ui/AddToCartButton.tsx
import { useCartStore } from '@/entities/cart';           // features → entities

// entities/product/ui/ProductCard.tsx
import { apiClient } from '@/shared/api/apiClient';       // entities → shared
```

**금지 ❌**

```ts
// entities/product/ui/ProductCard.tsx
// ↑ feature 간 직접 의존. 조합이 필요하면 widget 또는 page에서.
// shared/lib/toSearchQueryParams.ts
import type { ProductListQuery } from '@/_pages/product-list/model/types';
// ↑ 하위(entities)가 상위(features)를 앎 — 역방향. 이번 전환의 1순위 제거 대상.

// entities/cart/model/useCartStore.ts
import { useWishlistStore } from '@/entities/wishlist';
import { AddToCartButton } from '@/features/add-to-cart';
// ↑ 같은 레이어의 다른 슬라이스 직접 import

// features/add-to-cart/ui/AddToCartButton.tsx
import { WishlistToggleButton } from '@/features/toggle-wishlist';

// ↑ shared가 최상위 레이어의 타입을 앎. 이 때문에 toSearchQueryParams는 shared에 두지 않는다.
```

### A-6. 파일 매핑표

| 현재 위치                                                              | 목표 위치                                                   | 레이어 / 슬라이스 / 세그먼트       | 이동 또는 유지하는 이유                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/apiClient.ts`                                                     | `shared/api/apiClient.ts`                                   | shared / — / api                   | 도메인 지식 0. 어떤 슬라이스도 모른다.                                                                                                                                                                     |
| `api/commerce.ts` → `fetchHome`                                        | `_pages/home/api/homeQueries.ts`                            | _pages / home / api                | 두 도메인이 섞인 파일을 소비자 기준으로 분해. 홈 응답은 홈 페이지만 소비한다.                                                                                                                              |
| `api/commerce.ts` → `fetchProducts`                                    | `_pages/product-list/api/productListQueries.ts`             | _pages / product-list / api        | 동일. 목록 조회는 현재 목록 페이지만 소비한다.                                                                                                                                                             |
| `lib/query/get-query-client.ts`                                        | `shared/api/queryClient.ts`                                 | shared / — / api                   | 인프라. `lib`이라는 종류 이름 대신 목적(`api`)을 드러낸다.                                                                                                                                                 |
| `services/queries/home.ts`                                             | `_pages/home/api/homeQueries.ts` 로 통합                    | _pages / home / api                | `queryOptions`와 `queryFn`을 분리해 둘 이유가 없다. 같은 슬라이스 안 같은 세그먼트로 합친다.                                                                                                               |
| `services/queries/products.ts`                                         | `_pages/product-list/api/productListQueries.ts` 로 통합     | _pages / product-list / api        | 동일.                                                                                                                                                                                                      |
| `store/useCommerceStore.ts` → `cart`                                   | `entities/cart/model/useCartStore.ts`                       | entities / cart / model            | cart와 wishlist는 별개 도메인이다. 자료구조가 우연히 같을 뿐.                                                                                                                                              |
| `store/useCommerceStore.ts` → `wishlist`                               | `entities/wishlist/model/useWishlistStore.ts`               | entities / wishlist / model        | 위시리스트 제거 시 파일 하나 삭제로 끝나야 한다.                                                                                                                                                           |
| `types/commerce.ts` → `Product`,`Category`,`CategoryId`,`ProductSort`  | `entities/product/model/product.ts`                         | entities / product / model         | 소유자가 product 엔티티다.                                                                                                                                                                                 |
| `types/commerce.ts` → `ProductListQuery`,`ProductListResponse`         | `_pages/product-list/model/types.ts`                        | _pages / product-list / model      | URL 검색 조건과 그 응답. 소비자가 목록 페이지뿐이다.                                                                                                                                                       |
| `types/commerce.ts` → `HomeResponse`                                   | `_pages/home/model/types.ts`                                | _pages / home / model              | 홈 페이지 전용 집합 응답. 배너·카테고리·인기·신상품을 묶은 shape은 홈 화면이 결정한다.                                                                                                                     |
| `types/commerce.ts` → `ApiErrorResponse`                               | `shared/api/httpError.ts`                                   | shared / — / api                   | 도메인 무관. API 실패 계약이다.                                                                                                                                                                            |
| `types/commerce.ts` → `MockApiScenario`                                | `src/app/api/_data/` (mock 영역)                            | 범위 외                            | mock 백엔드 전용 제어값. 프론트엔드 타입 창고에 있을 이유가 없다.                                                                                                                                          |
| `utils/toSearchQueryParams.ts`                                         | `_pages/product-list/api/productListRequest.ts` 안으로 흡수 | _pages / product-list / api        | **`ProductListQuery`에 의존하므로 `shared/lib`에 두면 shared가 상위 레이어를 알게 된다.** 소비자와 같은 슬라이스로. 이후 결정표 #8 재검토에서 별도 파일이 아니라 백엔드 계약 파일 안의 비공개 함수가 됐다. |
| `app/(shop)/_components/ProductCard.tsx`                               | `entities/product/ui/ProductCard.tsx`                       | entities / product / ui            | 이동 전에 store 의존 제거 필요 (아래 I 섹션).                                                                                                                                                              |
| `app/(shop)/_components/Header.tsx`                                    | `widgets/header/ui/Header.tsx`                              | widgets / header / ui              | 두 엔티티 조합 + 두 페이지 공용.                                                                                                                                                                           |
| `app/(shop)/_components/HomeView.tsx`                                  | `_pages/home/ui/HomePage.tsx`                               | _pages / home / ui                 | 홈 화면 조합.                                                                                                                                                                                              |
| `app/(shop)/_components/HomeSection.tsx`                               | `_pages/home/ui/HomePageBoundary.tsx`                       | _pages / home / ui                 | 홈의 로딩·에러 경계. 경계 범위가 홈 페이지 단위이므로 홈 슬라이스 소유.                                                                                                                                    |
| `app/(shop)/products/_components/ProductListView.tsx`                  | `_pages/product-list/ui/ProductListPage.tsx`                | _pages / product-list / ui         | 목록 화면 조합.                                                                                                                                                                                            |
| `app/(shop)/products/_components/ProductList.tsx`                      | `_pages/product-list/ui/ProductListResult.tsx`              | _pages / product-list / ui         | "결과 영역"이라는 역할을 이름에 드러낸다.                                                                                                                                                                  |
| `app/(shop)/products/_hooks/useProductListQuery.ts`                    | `features/product-filter/model/useProductFilterState.ts`    | features / product-filter / model  | 필터의 URL 상태. **초안에서는 `_pages`로 예정했으나 S6b에서 feature 승격으로 바뀌었다** — 결정표 #6 참조. 조회 조건 조립을 뺀 뒤 이름도 바꿨다                                                             |
| `app/(shop)/products/_constants.ts`                                    | `features/product-filter/config/filters.ts`                 | features / product-filter / config | 필터 옵션 SSOT. 폼·URL 상태와 같은 슬라이스에 모인다.                                                                                                                                                      |
| `components/ui/{dialog,select}/`                                       | `shared/ui/{dialog,select}/`                                | shared / — / ui                    | 도메인 무관 재사용 UI. **폴더 통째 이동이라 내부 상대경로 import는 전부 유지된다.** (shared 단계에서 최종 확인)                                                                                            |
| `app/layout.tsx`, `app/providers.tsx`                                  | **유지**                                                    | Next 라우팅                        | `_app` 레이어를 만들지 않기로 했으므로 그대로 둔다.                                                                                                                                                        |
| `app/(shop)/layout.tsx`, `page.tsx`, `products/page.tsx`               | **유지 (얇게 축소)**                                        | Next 라우팅                        | 라우팅·조합 진입점. `_pages` 컴포넌트를 가져와 렌더만 한다.                                                                                                                                                |
| `app/week-05-layout.css`, `globals.css`                                | **유지**                                                    | Next 라우팅                        | 전역 스타일. CSS 결합 해소는 이번 범위 외.                                                                                                                                                                 |
| `examples/**`, `services/products.ts`, `services/useProductOptions.ts` | **유지**                                                    | 범위 외                            | 고아 묶음. R 섹션 참조.                                                                                                                                                                                    |
| `**/components/*-demo.tsx`                                             | `shared/ui/**/components/*-demo.tsx`                        | 범위 외 (폴더째 따라옴)            | 이동을 결정한 건 dialog/select 본체이고 데모는 같은 폴더 안이라 딸려 온다. 상대경로 import라 경로는 안 깨진다.                                                                                             |
| `app/api/**`                                                           | **유지**                                                    | mock 백엔드                        | Next Route Handler 규약에 묶여 있다.                                                                                                                                                                       |

### A-7. 애매한 파일 결정표

| #   | 대상                                       | 후보 A                      | 후보 B                       | 최종 결정                                                                  | 기준 / 근거                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------ | --------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `ProductCard`                              | `entities/product/ui`       | `widgets/product-card`       | **`entities/product/ui`**                                                  | 홈(`HomeView:51`)과 목록(`ProductList:50`) 두 곳이 이미 쓰고 있으니 재사용 범위가 페이지를 넘는다. 다만 담기·찜 같은 비즈니스 행위를 품은 채로는 entity가 못 되므로, 행위를 슬롯으로 떼는 게 이동의 전제조건이다. widget에 두면 "상품을 어떻게 보여주는가"라는 표현 지식이 조합 레이어로 올라가서 다른 페이지가 갖다 쓸 수 없다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2   | 상품 목록 `queryOptions`                   | `entities/product/api`      | `_pages/product-list/api`    | **`_pages/product-list/api`**                                              | 기준은 "여러 페이지에서 재사용되는가". 지금 쓰는 곳은 `ProductList` 하나뿐이다. entity로 올리면 아무도 안 쓰는 공용 API를 미리 파두는 셈이고, 그 순간 `ProductListQuery`(URL 조건)까지 entity가 알아야 해서 URL 상태 지식이 entity로 새어 들어간다. → **승격 트리거: 두 번째 소비 페이지가 생기면 `entities/product/api`로 올린다.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3   | 홈 `queryOptions` (`fetchHome`)            | `entities/product/api`      | `_pages/home/api`            | **`_pages/home/api`**                                                      | `/api/home` 응답은 배너, 카테고리, 인기, 신상품을 한 덩어리로 묶은 화면 주도 응답이다. 이 shape을 정하는 건 product 엔티티가 아니라 홈 화면이다. `Product[]`가 들어 있다는 이유만으로 entity에 두면 홈 레이아웃을 바꿀 때마다 entity가 흔들린다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4   | 장바구니 store                             | `entities/cart/model`       | `features/add-to-cart/model` | **`entities/cart/model`**                                                  | "담긴 상품 집합"은 상태이고 "담기"는 행위다. `Header`(widget)가 개수를 읽어야 하는데 store가 feature에 있으면 위젯이 행위 feature를 import하게 되고, 그 순간 표현과 행위의 경계가 무너진다. `toggleCart`는 상태를 바꾸는 일이라 model에 같이 둔다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 5   | `src/types/commerce.ts`                    | `shared/types`로 통째 이동  | 소유자 기준 분해             | **소유자 기준 분해**                                                       | 8개 파일이 이 한 파일에 매달려 있다(문제 ②). 통째로 옮겨봐야 위치만 바뀌고 결합은 그대로다. `ApiErrorResponse`는 인프라, `MockApiScenario`는 mock, `Product`는 product 엔티티, `ProductListQuery`는 목록 페이지 것이다. 주인이 전부 다르다. "이 타입의 소유자가 누구인가"에 파일 위치로 답한다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 6   | 필터 (폼 UI + nuqs URL 상태 + 선택지 목록) | `_pages/product-list/model` | `features/product-filter`    | **`features/product-filter`** (S6b에서 초안을 뒤집음)                      | **초안의 답은 `_pages`였고, 근거는 "한 페이지에서만 쓰니 feature일 필요가 없다"였다. 이 근거를 폐기했다.** 재사용 여부는 휴리스틱이지 feature의 정의가 아니다. feature는 **하나의 UI를 담당하고 사용자의 액션을 담당하는 단위**이고 필터가 정확히 그렇다. 실익도 있었다 — 폼 UI·URL 상태·선택지 목록 세 조각이 흩어져 있던 것이 폴더 하나로 모여 "필터를 통째로 들어낸다면"에 답할 수 있게 됐다.<br>**딸려온 것**: 결과 영역이 조건을 알아야 해서 feature가 훅을 Public API로 공개한다. 이 훅이 감싸는 것은 슬라이스 내부 상태가 아니라 **URL**이라 store 원본 노출과는 성격이 다르다.<br>**후속 조정(채점 피드백)**: `ProductListQuery` 타입은 필터가 아니라 `_pages/product-list`가 소유한다. 훅은 `state`만 반환하고 조회 조건 조립은 조회하는 쪽이 한다. 그래서 이름도 `useProductFilterState`로 바꿨다. |
| 7   | `_constants.ts` (`CATEGORY_FILTERS`)       | `entities/product/config`   | `_pages/product-list/config` | **`_pages/product-list/config`**                                           | `CATEGORY_FILTERS`에는 `'all'`이 들어 있다. 도메인 카테고리가 아니라 필터 UI의 선택지라는 뜻이다. 홈은 API 응답의 `categories`를 쓰지 이 상수를 쓰지 않는다. 쓰는 곳이 목록 페이지뿐이니 entity로 올리지 않는다. 도메인 값인 `CategoryId`는 `entities/product/model`에 남고 여기서 가져다 쓴다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 8   | 쿼리스트링 변환 (`toSearchQueryParams`)    | `shared/lib`                | `_pages/product-list/api`    | **`_pages/product-list/api` — 단, 별도 파일이 아니라 백엔드 계약 파일 안** | 이름만 보면 범용 유틸인데 시그니처가 `(query: ProductListQuery) => string`이다. `shared/lib`에 두면 shared가 `_pages`의 타입을 import해야 하고, 의존 방향이 최상위로 거꾸로 흐른다. 과제가 말한 "`shared/lib`을 이름 없는 유틸 창고로 만들지 말라"가 바로 이 경우다.<br>**세그먼트로 `lib`을 쓰지 않은 이유**: FSD의 `api` 세그먼트 정의에 매퍼(mapper)가 포함된다. "순수 함수인가"는 세그먼트 판별 기준이 아니다 — 세그먼트는 기술적 성질이 아니라 목적으로 나눈다. 그 기준을 일관 적용하면 `model/types.ts`도 순수하니 `lib`이어야 하는데 말이 안 된다.<br>**후속 재검토 → 파일 배치 변경**: 아래 절 참조.                                                                                                                                                                                                 |
| 9   | `HomeSection` (로딩·에러 경계)             | `shared/ui/QueryBoundary`   | `_pages/home/ui`             | **`_pages/home/ui`**                                                       | fallback 문구가 "홈 데이터를 불러오지 못했습니다"다. 특정 화면의 문구와 행위가 그대로 박혀 있다. shared로 빼내려면 문구를 props로 뽑아야 하는데, 쓰는 데가 홈과 목록 두 곳뿐이라 그렇게까지 할 이득이 없다(같은 코드 3회 반복 기준에 못 미친다).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10  | `components/ui/{dialog,select}`            | `shared/ui`로 이동          | 범위 외로 현 위치 유지       | **`shared/ui`로 이동** (S1에서 확정·완료)                                  | **전역 레이어로 사용하는 컴포넌트이기 때문이다.** 특정 도메인에 묶이지 않고 어느 화면에서든 쓰이는 성격이 `shared`의 정의 그대로다. 커머스 코드에서 지금 쓰는 데가 0이라는 점이 반대 근거였지만, 소비자 수는 "지금 몇 곳이 쓰는가"이지 "어느 레이어에 속하는가"의 답이 아니다. 부수적으로, 폴더째 옮기면 내부 상대경로가 살아남아 이동 비용이 사실상 없고, 남겨두면 `src/components/`가 FSD 레이어도 아닌 채로 최상위에 남는다. 같은 폴더의 `*-demo.tsx`가 딸려 오는데 이건 이동의 부산물일 뿐 `shared/ui`의 Public API에는 넣지 않는다.                                                                                                                                                                                                                                                                     |

### A-7-1. 결정표 #8 재검토 — 세그먼트는 맞았고 파일 배치가 틀렸다

리뷰 중 "`api`에 유틸이 왜 있나, 슬라이스 `lib` 세그먼트로 빼면 되지 않나"라는 지적이 나왔다. **세그먼트 판단은 유지했지만, 지적이 가리킨 냄새는 실재했고 원인이 달랐다.**

#### `lib`으로 옮기지 않은 근거

| #   | 근거                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | FSD의 `api` 세그먼트 정의에 **매퍼(mapper)가 포함**된다. 이 함수는 앱 표현(`ProductListQuery`)을 서버 표현(쿼리스트링)으로 옮기는 매퍼다                                 |
| 2   | **"순수 함수인가"는 세그먼트 판별 기준이 아니다.** 세그먼트는 기술적 성질이 아니라 목적으로 나눈다. 이 기준을 일관 적용하면 `model/types.ts`도 순수하니 `lib`이어야 한다 |
| 3   | 판별 테스트: 백엔드가 파라미터 이름을 바꾸면 이 코드가 바뀐다. **백엔드 계약에 묶인 코드의 자리는 `api`다.** `lib`은 백엔드가 바뀌어도 안 바뀌어야 한다                  |
| 4   | FSD의 `lib`은 "자체 목적을 가진 내부 라이브러리"다. 이 함수는 자체 목적이 없고 특정 호출의 부속품이라, `lib`에 두면 `lib`이 "`api`에 두기 애매한 것들의 창고"가 된다     |

#### 진짜 문제 — 백엔드 계약이 두 파일에 쪼개져 있었다

```
toSearchQueryParams.ts   파라미터 이름          ← 백엔드 계약
productListQueries.ts    엔드포인트 경로 /products ← 백엔드 계약
                         queryKey, staleTime      ← 캐시 정책
```

**같은 이유로 바뀌는 것이 갈라져 있고, 두 번째 파일은 계약과 정책을 섞고 있었다.** 파일 이름이 관심사가 아니라 함수 이름인 것도 같은 증상이다.

원인은 설계 판단이 아니라 이력이다. 원래 `src/utils/toSearchQueryParams.ts`였고 `git mv`로 옮기면서 파일 단위를 그대로 유지했다. "어디로 옮길까"만 묻고 "합칠까"를 묻지 않았다.

#### 변경 축으로 다시 갈랐다

```
api/productListRequest.ts   "이 백엔드와 어떻게 대화하는가"
                            ENDPOINT + toSearchParams(비공개) + fetchProductList
api/productListQueries.ts   "그 결과를 어떻게 캐시하는가"
                            queryKey + staleTime
```

| 변경                          | 바뀌는 파일 |
| ----------------------------- | ----------- |
| 백엔드가 `q` → `keyword`      | Request만   |
| 엔드포인트 `/products` → 변경 | Request만   |
| `staleTime` 조정              | Queries만   |
| `queryKey` 구조 변경          | Queries만   |

`toSearchParams`는 **`export`하지 않는다.** 계약 안에 갇혀 슬라이스 밖에서 보이지 않는다. S6a에서 `fetchHome`을 감춘 것과 같은 처리다.

#### 홈과의 비일관 아닌가

`_pages/home/api/homeQueries.ts`는 한 파일이다. 홈의 백엔드 계약은 `'/home'` 한 줄이고 파라미터가 없어 **나눌 축이 없다.** 기준은 "파일 개수를 맞춘다"가 아니라 **"변경 축이 둘이면 나누고 하나면 안 나눈다"**이고, 이 기준은 두 슬라이스에 일관되게 적용됐다.

### A-8. 마이그레이션 단계와 검증 방법

**아래 레이어부터 올라간다.** 의존이 아래로만 흐르니 하위부터 옮기면 상위는 import 경로만 고치면 되고, 중간 어느 단계에서 멈춰도 컴파일이 된다. 위에서부터 옮기면 단계마다 참조가 깨져서 결국 큰 덩어리 커밋 하나로 뭉친다.

| 단계 | 범위                                                                                              | 검증                                                           |
| ---- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| S1   | `shared/api` (apiClient, queryClient) + `shared/ui` (dialog, select)                              | `pnpm typecheck` · 홈/목록 렌더                                |
| S2   | `entities/product` — 타입 분해 + `ProductCard` 행위 분리(슬롯 도입)                               | `pnpm typecheck` · 홈/목록 카드 렌더 + 담기/찜 동작 유지       |
| S3   | `entities/cart`, `entities/wishlist` — store 분해                                                 | 헤더 개수 · 새로고침 후 persist 복원 · 홈↔목록 상태 동기화     |
| S4   | `features/add-to-cart`, `features/toggle-wishlist`                                                | 토글 동작 · 헤더 개수 반영                                     |
| S5   | `widgets/header`                                                                                  | 두 페이지 레이아웃 · 헤더 리렌더 범위                          |
| S6   | `_pages/home`, `_pages/product-list` (queries · config · model · ui)                              | 검색 · 카테고리 · 정렬 · 페이지네이션 · URL 공유 · 뒤로/앞으로 |
| S7   | `app/**` 얇게 축소 + 구 폴더(`api/ services/ store/ types/ utils/ lib/ components/`) 제거         | **`pnpm check` 전체 통과** · 0단계 기준선 표 전 항목 재확인    |
| S8   | **[별도 커밋 · 기능 변경]** 에러 경계 설계 — `HttpError` 도입 → `throwOnError` 기준 → `error.tsx` | 실패 재현 (아래 4단계 표)                                      |
| S9   | 삭제 시나리오 자가 검증 (코드 변경 0)                                                             | 예측 vs 실제 대조                                              |

- S1~S7은 구조만 건드린다. 동작이 바뀌면 그 단계는 실패로 본다.
- S8은 동작이 바뀌니 커밋을 반드시 따로 뗀다.
- 단계마다 `pnpm typecheck`(빠름), S7에서 `pnpm check`(전체).
- **S3 주의**: persist key를 `commerce-store` 하나에서 둘로 나누면 기존 localStorage 데이터가 날아간다. 비로그인 로컬 데이터인 데다, 이관 코드를 넣으면 구조 변경 커밋에 데이터 마이그레이션이 섞인다. 유실을 받아들이고 이 사실만 기록해둔다.

---

## D — Data Model (상태 분류표)

| 상태                           | Source of Truth                   | 소유 슬라이스 / 레이어             | 소비하는 곳                                      | 이동 후에도 중복 저장하지 않는 방법                                                                                                                          |
| ------------------------------ | --------------------------------- | ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 홈 조회 결과                   | 서버 / TanStack Query             | `_pages/home/api`                  | `_pages/home/ui/HomePage`                        | `queryKey: ['home']` 하나가 유일 식별자. 서버 prefetch → dehydrate → hydrate 경로 유지. store에 복사 금지.                                                   |
| 상품 목록 조회 결과            | 서버 / TanStack Query             | `_pages/product-list/api`          | `_pages/product-list/ui/ProductListResult`       | `queryKey: ['products', query]`. URL 조건이 원본이고 key는 거기서 나온 값이다. 응답을 `useState`에 담지 않는다.                                              |
| 검색 · 정렬 · 페이지           | URL / nuqs                        | `features/product-filter/model`    | `ProductFilterForm`, `ProductListPage`           | `useProductFilterState`가 `useQueryStates` 결과를 그대로 반환. 별도 `useState` 미러링 없음. 폼과 페이지가 훅을 각각 호출해도 원본이 URL이라 갈라지지 않는다. |
| 조회 조건 (`ProductListQuery`) | **파생값** — 위 URL 상태에서 조립 | `_pages/product-list/model` (타입) | `ProductListResult`(props), `productListQueries` | 저장하지 않는다. `ProductListPage`가 `state`에 `pageSize`를 붙여 만든다. 사용자가 고르지 않는 값이 섞이므로 필터가 아니라 조회하는 쪽의 것이다.              |
| 검색어 입력 중간값             | React 로컬 (`useState`)           | `features/product-filter/ui`       | `ProductFilterForm` 내부                         | submit 할 때만 URL에 반영. 확정된 검색어의 원본은 URL 하나뿐이고 draft는 UI 임시값이다.                                                                      |
| 장바구니                       | Zustand (`persist`)               | `entities/cart/model`              | `features/add-to-cart`, `widgets/header`         | `string[]` 하나만 저장. **개수는 `length`로 파생**하고 `count` 필드를 두지 않는다.                                                                           |
| 위시리스트                     | Zustand (`persist`)               | `entities/wishlist/model`          | `features/toggle-wishlist`, `widgets/header`     | 동일. cart와 별도 store이므로 서로의 상태를 참조하지 않는다.                                                                                                 |
| 담김 / 찜 여부                 | **파생값**                        | 소유자 없음                        | `AddToCartButton`, `WishlistToggleButton`        | `cart.includes(id)`로 렌더 시점에 계산. 별도 상태로 저장하지 않는다.                                                                                         |
| Dialog 열림 여부               | React 로컬                        | `shared/ui/dialog`                 | 해당 UI                                          | 컴포넌트 내부 상태. 전역으로 올리지 않는다.                                                                                                                  |

> **불변 규칙**: 서버 응답을 Zustand에 복사하지 않는다. URL 상태를 `useState`에 동기화하지 않는다. 파생 가능한 값은 저장하지 않고 계산한다.

---

## I — Interface

### I-1. `ProductCard` × 장바구니 · 위시리스트 조합 방법

**문제**: 지금 `ProductCard`는 `useCommerceStore`를 직접 구독한다(`ProductCard.tsx:12-15`). 이 상태로 `entities/product/ui`에 옮기면 그대로 `entities → features` 역방향 의존이 된다.

**결정**: `ProductCard`는 action 영역을 슬롯으로 받기만 하고, 조합은 상위 레이어에서 한다.

```ts
// entities/product/ui/ProductCard.tsx  — 상품을 "어떻게 보여줄지"만 안다
type ProductCardProps = {
  product: Product;
  actions?: ReactNode; // 무엇이 들어올지 모른다 = features를 모른다
};
```

```tsx
// _pages/product-list/ui/ProductListResult.tsx — 조합은 상위에서
<ProductCard
  product={product}
  actions={
    <>
      <WishlistToggleButton productId={product.id} />
      <AddToCartButton productId={product.id} />
    </>
  }
/>
```

- `entities/product`는 `features/*`를 **모른다** → 하위가 상위를 모름
- `features/add-to-cart`와 `features/toggle-wishlist`는 **서로를 모른다** → 같은 레이어 직접 의존 없음
- 두 feature의 협력은 page(또는 widget)에서만 일어난다

**미결 — S5/S6 진입 시 확정**: 홈과 목록 두 곳에 같은 조합 코드가 생긴다. `widgets/product-grid`로 조합 지점을 하나로 모을지, 각 페이지에서 따로 조합할지 아직 안 정했다. 지금은 반복이 2회라 "3회 이상이면 공통화" 기준에 못 미친다. 게다가 홈 그리드와 목록 그리드는 페이지네이션과 총개수 유무가 달라서, 억지로 묶으면 오히려 손해다. **기본안: 각 페이지에서 조합, 위젯은 만들지 않음.**

### I-2. 슬라이스별 공개 / 은닉

| 슬라이스                   | 공개 (Public API)                                                   | 숨기는 구현 세부                                     |
| -------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `entities/product`         | `ProductCard`, `Product`·`Category`·`CategoryId`·`ProductSort` 타입 | `ui/` 내부 파일 경로, 카드 내부 마크업 구조          |
| `entities/cart`            | `useCartStore` (selector 사용 전제)                                 | `toggle` 헬퍼, persist key 이름, 내부 배열 조작 방식 |
| `entities/wishlist`        | `useWishlistStore`                                                  | 동일                                                 |
| `features/add-to-cart`     | `AddToCartButton`                                                   | 어떤 store를 쓰는지, 버튼 내부 상태 계산             |
| `features/toggle-wishlist` | `WishlistToggleButton`                                              | 동일                                                 |
| `widgets/header`           | `Header`                                                            | 개수를 어느 엔티티에서 읽는지                        |

### I-3. Public API 결정 — barrel과의 구분

**barrel file**은 경로를 줄이려고 내부를 습관적으로 다시 내보내는 파일이다. 경계를 그으려는 의도가 없고, `export *`가 쌓이면 이름 충돌과 순환 의존, 번들 비용만 남는다.
**Public API**는 "외부가 알아도 되는 건 이것뿐"이라는 계약이다. 같은 `index.ts`라도 무엇을 감추려고 만들었는지가 다르다.

**결정: 감출 게 실제로 있는 슬라이스에만 `index.ts`를 둔다.**

| 위치                                     | `index.ts` | 의도                                                                                                                                                               |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `entities/{product,cart,wishlist}`       | ✅ 둠      | store 원본을 그대로 열어두면 외부 어디서든 내부 배열을 직접 주무를 수 있다. 읽기용 훅과 액션만 공개하고 persist key와 내부 헬퍼는 감춘다. 감출 대상이 실제로 있다. |
| `features/{add-to-cart,toggle-wishlist}` | ✅ 둠      | 외부는 버튼 컴포넌트 하나만 알면 된다. 어떤 store를 어떻게 쓰는지는 feature 안쪽 사정이다.                                                                         |
| `widgets/header`                         | ✅ 둠      | 위젯이 어떤 엔티티를 조합하는지 소비자가 알 필요 없다.                                                                                                             |
| `shared/ui/{dialog,select}`              | ❌ 안 둠   | 각 컴포넌트 폴더에 이미 `index.tsx`가 진입점으로 있다. `shared/ui/index.ts`를 얹으면 다시 내보내기만 하는 순수 barrel이 된다.                                      |
| `shared/api`                             | ❌ 안 둠   | 파일 셋(`apiClient`, `httpError`, `queryClient`)이 전부 공개 대상이다. 감출 게 없으면 계약도 없다.                                                                 |
| `_pages/*`                               | ❌ 안 둠   | 쓰는 곳이 `app/**/page.tsx` 한 군데뿐이다. 계약 맺을 상대가 없는데 계약서부터 쓰면 그게 barrel이다.                                                                |

**규칙**: `export *` 금지. 이름을 명시한 export만 쓴다. `index.ts`에 적히지 않은 것은 슬라이스 밖에서 import하지 않는다.

---

## O — Optimization

### 캐시 정책 — 유지

| 쿼리                  | staleTime | 유지 근거                                                                                             |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `['home']`            | 5분       | 배너·카테고리·인기·신상품은 자주 안 바뀐다. SSR로 채운 캐시를 클라이언트가 즉시 재요청하지 않게 한다. |
| `['products', query]` | 30초      | 필터 결과는 홈보다 최신 데이터일 필요가 크다.                                                         |

**폴더를 옮긴다고 캐시 정책이 달라질 이유는 없다.** `queryKey` 구조와 `staleTime` 값을 그대로 옮긴다. 값이 바뀌면 그건 구조 변경이 아니라 성능 튜닝이라 커밋을 나눠야 한다.
`placeholderData: keepPreviousData`도 그대로 둔다. 조건을 바꾸는 동안 이전 목록을 붙들어 깜빡임을 막는 요구사항이 여전히 살아 있다.

### 로딩 경계 범위 — route `loading.tsx` vs Query `isPending`

| 수단                        | 담당 범위                            | 이번 주 사용 여부                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| route `loading.tsx`         | 라우트 전체 전환 로딩                | **안 씀.** 홈은 서버에서 prefetch한 뒤 `HydrationBoundary`로 넘기니 route 레벨 로딩이 뜰 구간 자체가 없다. 목록은 조건을 바꿔도 필터 폼이 살아 있어야 하는데, route 로딩은 폼까지 덮어버린다. 요구사항과 정반대다. |
| `Suspense` (page.tsx, 목록) | nuqs `useSearchParams` 프리렌더 요건 | **씀.** 빌드 요건이라 필수. 런타임에는 뜨지 않는다.                                                                                                                                                                |
| `Suspense` (홈 경계)        | 홈 데이터 조회                       | **씀.** `useSuspenseQuery`가 suspend한다.                                                                                                                                                                          |
| Query `isPlaceholderData`   | 목록 결과 영역만                     | **씀.** 필터 폼은 유지하고 결과 영역만 `aria-busy` + 버튼 disable.                                                                                                                                                 |

### 이번 주에 하지 않을 최적화

| 안 할 것                           | 근거                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staleTime` 값 재조정              | `productListQueryOptions`에 "30초가 맞을까..." 주석이 달려 있다. 값을 바꾸려면 측정이 필요하고, 그 결과는 폴더 구조와 무관하다. 지금은 옮기기만 한다. |
| `apiClient`에 POST/PUT/DELETE 추가 | 지금 필요한 건 GET뿐이다. 일어나지 않는 시나리오에 코드를 만들지 않는다.                                                                              |
| `week05-*` 전역 CSS 결합 해소      | R 섹션과 같은 이유. 스타일 방식 변경이라 이번 커밋과 섞으면 실패 원인을 가릴 수 없다.                                                                 |

---

## 4단계 — 에러 처리 경계 설계

### 선행 조건 (블로커)

지금 `apiClient.get`은 실패를 전부 `new Error(message)`로 만들면서 HTTP status를 버린다(`apiClient.ts:38-46`). 이래서는 "5xx는 경계로, 4xx는 인라인" 기준을 코드로 옮길 방법이 없다.

→ `shared/api/httpError.ts`에 status를 살려두는 에러 타입을 만든다.

```ts
// shared/api/httpError.ts — 화면 문구·행위는 넣지 않는다
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export class NetworkError extends Error {}
```

- **네트워크 오류**: `fetch` 자체가 reject → `NetworkError`
- **HTTP 오류**: `!res.ok` → `HttpError(status, body.message ?? ...)`
- **비즈니스 오류**: 지금 mock API에는 없다. 나중에 생기면 `HttpError`와 구분되는 타입을 따로 만든다.
- `shared`에는 "홈 데이터를 불러오지 못했습니다" 같은 특정 화면의 문구나 행위를 넣지 않는다. 문구는 각 페이지의 fallback이 갖는다.

### 에러 처리 표

| 실패 유형                            | 처리 위치                                                | Error Boundary로 전파?                       | 사용자 UI                                 | 재시도 방법                                      | 이 경계를 선택한 이유                                                                                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 상품 목록 조회 실패 (5xx · 네트워크) | `_pages/product-list/ui/ProductListPage`의 ErrorBoundary | **O** (`throwOnError`가 5xx·네트워크만 true) | 결과 영역만 대체, **필터 폼은 유지**      | `resetErrorBoundary` + `QueryErrorResetBoundary` | 서버 장애는 사용자가 손쓸 도리가 없다. 그렇다고 화면 전체를 덮으면 애써 넣은 조건이 사라져 다시 시도하기가 번거로워진다. 조건(URL)은 살리고 결과만 갈아 끼운다.                                                                                                               |
| 잘못된 검색 조건 (4xx)               | `ProductListResult` 인라인                               | **X**                                        | 결과 영역에 안내 문구 + 조건 수정 유도    | 사용자가 필터를 바꾸면 자동 재조회               | 사용자가 직접 고칠 수 있는 오류다. 경계로 던져버리면 고칠 수단인 폼까지 언마운트돼서 빠져나올 길이 없어진다.                                                                                                                                                                  |
| 빈 결과 (0건)                        | `ProductListResult` 인라인                               | **X**                                        | "조건에 맞는 상품이 없습니다"             | 해당 없음                                        | 에러가 아니라 정상 응답이다. 에러 경로에 섞어 넣으면 멀쩡한 흐름까지 에러처럼 보인다.                                                                                                                                                                                         |
| 홈 조회 실패                         | `_pages/home/ui/HomePageBoundary`                        | **O**                                        | 홈 섹션 전체 대체 + 다시 시도 버튼        | `resetErrorBoundary`                             | 홈은 화면 전체가 응답 하나에 매달려 있다. 부분만 살려둘 성공 영역이 없다. (`useSuspenseQuery`는 항상 throw한다)                                                                                                                                                               |
| 예상하지 못한 렌더링 오류            | `app/(shop)/error.tsx`, `app/(shop)/products/error.tsx`  | **O** (React가 자동)                         | 라우트 단위 fallback + 새로고침 없는 복구 | Next `reset()`                                   | 컴포넌트 트리가 망가진 상태라 부분 복구를 믿을 수 없다. 라우트 세그먼트 단위로 잘라내서 헤더와 레이아웃은 살린다.                                                                                                                                                             |
| 장바구니 · 위시리스트 행위 오류      | **해당 없음**                                            | —                                            | —                                         | —                                                | `toggleCart`/`toggleWishlist`는 zustand 로컬 동기 연산이라 실패할 길이 없다. 억지로 처리 코드를 만들지 않는다. → **필요해지는 시점: 이 토글이 서버 요청을 타게 될 때.** 그때는 요청 실패 콜백에서 feature 안쪽 인라인으로 처리한다(Error Boundary는 비동기 콜백을 못 잡는다). |

### 구현 항목 (S8)

1. `throwOnError` 기준을 표의 "전파?" 열과 **코드에서 일치**시킨다.
   ```ts
   throwOnError: (error) => error instanceof NetworkError || (error instanceof HttpError && error.status >= 500);
   ```
   현재의 `throwOnError: true`(무조건 전파)를 대체한다.
2. `app/(shop)/error.tsx`, `app/(shop)/products/error.tsx` 추가 — fallback + `reset`.
3. 4xx 인라인 처리: `ProductListResult`에서 `HttpError` status 4xx를 받아 안내 문구 렌더.

### Error Boundary가 못 잡는 오류

Error Boundary는 렌더 단계에서 난 오류만 잡는다. 이벤트 핸들러나 비동기 콜백(`setTimeout`, `.then`, `async` 함수 본문)에서 던진 오류는 못 잡는다. 그 시점의 React는 오류가 어느 렌더 트리에 속하는지 알 도리가 없다.

| 오류 위치                   | 현재 상태                            | 처리 방침                                                |
| --------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `onClick`의 `toggleCart` 등 | 로컬 동기 연산이라 실패 없음         | 처리 코드 만들지 않음                                    |
| TanStack Query의 `queryFn`  | Query가 캐치해 `error` 상태로 전달   | `throwOnError` 기준으로 경계 전파 여부 결정 (위 표)      |
| 비동기 콜백                 | 현재 프로젝트에 해당하는 코드가 없다 | 생기면 그 콜백 안에서 직접 처리한다. 경계로는 못 던진다. |

### 검증

- mock API의 `scenario` 제어값으로 실패를 재현한다. `scenario`는 사용자 URL 상태에도 `ProductListQuery`에도 넣지 않는다(지금도 떨어져 있다 — `features/product-filter/model/useProductFilterState.ts` 주석).
- `error.tsx`를 확인하려고 임시 `throw`를 넣었다면 확인이 끝나는 대로 지운다.

| 재현 시나리오                     | 재현 방법                                              | 기대 동작                                       | 결과           |
| --------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | -------------- |
| mock 이 4xx/5xx/빈결과를 만드는가 | `curl` 로 직접 호출                                    | 400 / 500 / 빈 배열                             | ✅ 확인        |
| **4xx 가 UI 에서 도달 가능한가**  | `/products?page=-1`                                    | 400 응답                                        | ✅ 확인        |
| 목록 4xx                          | `/products?page=-1` 접속                               | 인라인 안내, 필터 폼 유지, 경계로 전파 안 됨    | ✅ 사용자 확인 |
| 목록 5xx·네트워크                 | 서버를 내린 뒤 필터 조작 (NetworkError)                | 결과 영역만 fallback, 필터 폼 유지, 재시도 동작 | ✅ 사용자 확인 |
| 목록 빈 결과                      | 결과가 없는 검색어 입력                                | "조건에 맞는 상품이 없습니다"                   | ✅ 사용자 확인 |
| 홈 조회 실패                      | 서버를 내린 뒤 홈 새로고침                             | 홈 섹션 fallback + 재시도                       | ✅ 사용자 확인 |
| 렌더 중 임시 `throw`              | `HomePage` 최상단에 `throw new Error('probe')` 후 제거 | `error.tsx` fallback, `reset` 복구, Header 생존 | ✅ 사용자 확인 |

> `✅ 확인` 은 `curl` 로 측정한 값이고, `✅ 사용자 확인` 은 브라우저에서 직접 눌러 본 결과다.
>
> `scenario` 는 프론트가 절대 보내지 않는 mock 전용 제어값이라 UI 로는 5xx 를 만들 수 없다.
> 대신 **서버를 내리면 `NetworkError`** 가 발생해 같은 경계 경로를 탄다(`shouldEscalateToBoundary` 가 둘 다 true).

### 4xx 도달 경로 — 인라인 분기가 죽은 코드가 아님을 확인

`page` 는 nuqs `parseAsInteger` 라 **음수를 정상 정수로 통과**시키고, `productListRequest.ts` 의 `toSearchParams` 가 그대로 실어 보낸다. mock 은 `isPositiveInteger` 검사에서 400 을 준다.

```
/products?page=-1  →  GET /api/products?page=-1  →  400 요청 조건을 확인해주세요.
```

사용자가 URL 을 고치면 닿는 경로이고, **필터를 바꾸면 스스로 빠져나올 수 있는** 오류다. 경계로 던졌다면 고칠 수단인 필터 폼까지 언마운트되어 복구 경로가 사라진다. 4xx 를 인라인으로 둔 판단이 실제 경로로 뒷받침된다.

(`page=0` 은 `toSearchParams` 의 `if (query.page)` 에서 falsy 라 전송되지 않는다.)

---

## 5단계 — 삭제 시나리오 자가 검증

> 마이그레이션(S7) 완료 후 코드를 수정하지 않고 답한다. **아래 "예상"은 지금 작성하고, "실제"는 S9에서 대조한다.**

### 시나리오 A — "위시리스트 기능을 통째로 제거한다면"

| 구분                 | 예상 (구조 설계 기준)                                                                                                                                             | 실제 (코드 검증)                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 통째로 **삭제**할 것 | `entities/wishlist/` (폴더)<br>`features/toggle-wishlist/` (폴더)                                                                                                 | ✅ 일치 — 정확히 이 두 폴더(파일 4개)뿐 |
| **수정**이 필요한 것 | `widgets/header/ui/Header.tsx` (개수 표시 제거)<br>`_pages/home/ui/HomePage.tsx` (actions 슬롯에서 제거)<br>`_pages/product-list/ui/ProductListResult.tsx` (동일) | ✅ 일치 — 정확히 이 3개 파일            |
| 판정 기준            | 지울 게 폴더 2개로 모이고 고칠 데가 조합 지점 3곳뿐이면 성공. grep 없이 목록을 댈 수 있어야 한다.                                                                 | ✅ 성공                                 |

**수정 대상의 실제 라인** — 전부 import 한 줄 + 사용처 한두 줄이다. 로직을 뜯어내는 수술이 아니다.

| 파일                                           | 지울 라인                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `widgets/header/ui/Header.tsx`                 | `4` import · `13` selector · `21` `<span>위시리스트 {wishList.length}</span>` |
| `_pages/home/ui/HomePage.tsx`                  | `5` import · `57` `<WishlistToggleButton .../>`                               |
| `_pages/product-list/ui/ProductListResult.tsx` | `6` import · `70` `<WishlistToggleButton .../>`                               |

세 곳 모두 **조합 지점**이다. 조합한 것을 빼는 일이라 표현·행위 코드에는 손대지 않는다.

**전환 전 구조로 같은 질문을 던지면**: 지울 파일이 하나도 없다. `store/useCommerceStore.ts`는 파일 안을 열어 도려내야 하고, `ProductCard.tsx`는 버튼과 상태와 핸들러를 빼내야 하고, `Header.tsx`도 손봐야 한다. 전부 "수정"이고 "삭제"는 0건이다. 응집에 실패했다는 뜻이고, store를 쪼개기로 한 근거가 여기서 나왔다.

### 시나리오 B — "신상품 뱃지를 상품 카드에 추가한다면"

| 구분                 | 예상                                                                                                                                                         | 실제 (코드 검증)                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 터치할 파일          | `entities/product/ui/ProductCard.tsx` (뱃지 렌더) **한 파일**. `Product`에 이미 `createdAt`이 있고 홈 응답에도 `newProducts`가 있어서 타입은 건드릴 게 없다. | ⚠️ **판정 규칙에 따라 갈린다** — 아래 참조 |
| 터치하지 **않을** 것 | `features/*`, `widgets/*`, `_pages/*`. 뱃지는 표현이지 행위가 아니라서 조합 레이어가 몰라도 된다.                                                            | 규칙 ①이면 ✅ 일치 / 규칙 ②면 ❌           |
| 판정 기준            | entity 슬라이스 안에서만 끝나야 한다. `_pages` 두 곳을 다 고쳐야 한다면 표현 지식이 위로 샌 것이다.                                                          | 조건부 성공                                |

**예상이 절반만 맞았다.** "신상품"의 판정 규칙을 정하지 않고 답을 썼는데, 규칙에 따라 변경 반경이 달라진다.

| 판정 규칙                             | 터치할 파일                                                                                                      | 응집                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------- |
| ① `createdAt` 이 최근 N일 이내        | `entities/product/ui/ProductCard.tsx` **1개**. `createdAt` 은 `Product` 에 이미 있다                             | ✅ entity 안에서 끝난다     |
| ② 홈 응답의 `newProducts` 목록에 속함 | `ProductCard`(뱃지 렌더) + `HomePage`(어느 섹션인지 전달) + `ProductListResult`(목록엔 이 정보가 없어 판단 불가) | ❌ 표현 지식이 page 로 샌다 |

**규칙 ①을 택해야 한다.** `createdAt` 은 상품 자체의 속성이라 entity 가 스스로 판단할 수 있다. `newProducts` 는 **홈 화면이 만든 분류**(`route.ts:28` 에서 `createdAt` 내림차순 6개)라 상품의 속성이 아니다. 목록 페이지 응답에는 이 정보가 아예 없어서 같은 카드가 화면에 따라 다르게 보이는 문제도 생긴다.

> 즉 이 사고 실험의 진짜 소득은 "몇 개 파일을 고치나"가 아니라 **"뱃지의 근거를 상품의 속성에서 찾을 것인가, 화면의 분류에서 찾을 것인가"** 가 변경 반경을 결정한다는 점이다. 전자는 entity 안에서 끝나고 후자는 조합 레이어로 샌다.

**이번 주에 고칠 것 / 남길 것**: 파편화는 발견되지 않았다. 시나리오 A 는 예상과 정확히 일치했고, B 는 구조 문제가 아니라 요구사항 정의의 모호함이었다. 고칠 대상 없음.

---

## FSD 이해 확인 질문

**1. `ProductCard`가 찜 버튼을 직접 import하면 어떤 의존 규칙을 어기며, 어디에서 조합해야 하는가?**

`ProductCard`는 `entities/product`에 있고 찜 버튼은 `features/toggle-wishlist`에 있다. entities가 features보다 아래라서, 하위가 상위를 아는 역방향 의존이 되고 "자기보다 아래 레이어만 import한다"는 규칙이 깨진다. 진짜 문제는 방향을 어겼다는 사실보다 그 결과다. 상품 표현을 재사용하려는데 장바구니와 위시리스트가 늘 따라붙고, 위시리스트를 지우려면 product 엔티티까지 열어야 한다. `ProductCard`에 `actions` 슬롯을 두고 page나 widget에서 조합하면 된다. 그러면 entity는 뭐가 꽂히는지 모른 채 자리만 내준다.

**2. 한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가? 내 프로젝트에서는 어떻게 결정했는가?**

**반드시는 아니지만 내 프로젝트에서는 feature로 만들었다. 그리고 그 과정에서 판단 기준을 한 번 갈아엎었다.**

초안의 답은 "아니다"였다. 근거는 "이 훅은 `/products` URL 스키마에 묶여 있어 다른 라우트로 옮길 수 없으니 재사용되지 않는다"였다. **이 근거를 폐기했다.** 재사용 여부는 feature를 판별하는 휴리스틱이지 정의가 아니다. 재사용은 feature가 되면 따라오는 성질이지 조건이 아니다.

정의로 돌아가면 feature는 **하나의 UI를 담당하고 사용자의 액션을 담당하는 단위**다. 상품 필터링은 정확히 그렇다. 그래서 `features/product-filter`로 올렸고, 흩어져 있던 폼 UI·URL 상태(`useProductFilterState`)·선택지 목록(`config/filters.ts`)이 폴더 하나로 모였다. "필터를 통째로 들어낸다면"에 폴더 하나로 답할 수 있게 된 것이 실익이다.

대신 경계를 하나 그었다. **조회 조건(`ProductListQuery`)은 필터의 것이 아니다.** 필터는 "사용자가 무엇을 골랐는가"까지만 알고, 그 값에 `pageSize`처럼 사용자가 고르지 않는 값을 붙여 조회 조건으로 만드는 일은 조회하는 쪽(`_pages/product-list`)이 한다. 훅이 `state`만 반환하고 이름에서 "Query"를 뺀 이유다.

**3. `formatPrice`는 항상 `shared/lib`인가? 통화·회원 등급·상품 정책이 포함되면 결정이 어떻게 달라지는가?**

아니다. 파일 이름이 아니라 그 함수가 어떤 도메인 지식을 알아야 하는지로 가른다. `Intl`로 천 단위 구분과 통화 기호만 붙인다면 아는 도메인이 하나도 없으니 `shared/lib`이 맞다. 그런데 회원 등급별 할인율이나 쿠폰 중복 같은 상품 정책이 들어오면 얘기가 달라진다. 그 함수는 `User`와 `Product`를 알아야 하고, `shared`가 상위 레이어의 도메인 타입을 import하면서 방향이 거꾸로 흐른다. 그때는 `entities/product/lib`으로 내린다. 내 프로젝트에서는 쿼리스트링 변환 함수가 이 판정에 걸렸다. 이름은 범용 유틸처럼 생겼지만 시그니처가 `(query: ProductListQuery) => string`이라 상위 타입을 알아야 해서, `shared/lib` 대신 쓰는 쪽 슬라이스로 보냈다. 지금은 `_pages/product-list/api/productListRequest.ts` 안의 비공개 함수다.

**4. 두 feature가 협력해야 할 때 직접 import하지 않고 어떤 상위 레이어에서 조합했는가?**

`features/add-to-cart`와 `features/toggle-wishlist`는 같은 상품 카드 위에 나란히 놓이지만 서로를 import하지 않는다. 조합은 `_pages/product-list/ui/ProductListResult`와 `_pages/home/ui/HomePage`에서 한다. `ProductCard`의 `actions` 슬롯에 두 버튼을 나란히 넣으면 끝이다. 두 feature가 서로를 모르니 한쪽을 지워도 다른 쪽 코드는 열어볼 일조차 없다. `Header`처럼 어느 페이지에도 속하지 않는 조합은 `widgets/header`가 맡는다.

**5. 폴더 이동 후에도 TanStack Query 데이터와 Zustand 데이터를 서로 복사하지 않은 이유는 무엇인가?**

둘은 주인이 다르다. 상품 데이터의 원본은 서버이고, Query 캐시는 그 사본을 맡아둔 계층이다. Zustand가 들고 있는 건 "이 사용자가 무엇을 담았는가"라는 클라이언트 쪽 사실이고, 비로그인이라 서버는 이걸 모른다. 서버 응답을 store에 복사해두면 캐시가 무효화되는 순간 두 사본이 갈라지고, 어느 쪽이 맞는지 가릴 방법이 없어진다. 담김 여부(`cart.includes(id)`)와 개수(`cart.length`)도 마찬가지다. 배열에서 뽑아낼 수 있으니 저장하지 않고 계산한다. 폴더 위치는 이 소유권 문제와 아무 상관이 없다. 슬라이스를 옮겼다고 판단이 달라질 이유가 없었다.

**6. barrel file과 Public API는 무엇이 다른가? 내 프로젝트에서는 어느 쪽을 선택했고 그 의도는 무엇인가?**

생긴 건 똑같은 `index.ts`인데 목적이 반대다. barrel은 경로를 줄이려고 내부를 다시 내보내는 파일이라 감출 대상이 없고, `export *`가 쌓이면 이름 충돌과 순환 의존, 번들 비용만 남는다. Public API는 "외부가 알아도 되는 건 이것뿐"이라는 계약이라 감출 대상이 반드시 있다. 나는 감출 게 실제로 있는 슬라이스에만 `index.ts`를 뒀다. `entities/*`는 store 원본과 persist key를, `features/*`는 어떤 store를 쓰는지를, `widgets/header`는 어떤 엔티티를 조합하는지를 감춘다. `shared/api`는 파일 셋이 전부 공개 대상이고 `_pages/*`는 쓰는 곳이 `page.tsx` 한 군데뿐이라 만들지 않았다. 계약 맺을 상대가 없는데 계약서부터 쓰면 그게 barrel이다. `export *`는 전면 금지하고 이름을 명시한 export만 쓴다.

---

## Advanced (선택)

| 항목                      | 채택 여부                    | 메모                                              |
| ------------------------- | ---------------------------- | ------------------------------------------------- |
| A. 의존성 하네스 (ESLint) | ✅ 채택 — S1 **전** 도입     | 아래 절 참조.                                     |
| B. 변경 반경 실험         | ✅ 채택 — "조건 전체 초기화" | 아래 절 참조. **예상을 먼저 커밋한 뒤 구현했다.** |

### A. 의존성 하네스 — `eslint-plugin-boundaries@7.1.0`

**도입 시점을 앞당긴 근거**: 초안에는 "S2~S6 중간"으로 적었다. 하네스의 값은 규칙을 기계에 새기는 것인데, 이사가 절반 진행된 뒤에 켜면 이미 쌓인 위반을 한 번에 찾는 사후 감사가 된다. 파일을 옮기기 전에 켜두면 레이어가 하나씩 착륙할 때마다 그 커밋이 검증된다. 과제는 Advanced를 "기본 과제 완료 후"로 안내하지만, 이 항목만은 순서를 뒤집는 편이 값이 크다고 판단했다.

**도구 선택**: `steiger`(FSD 공식 린터)가 슬라이스·세그먼트·Public API를 자동 인식해 설정이 거의 필요 없다. 그런데 `pnpm lint` 밖의 별도 CLI라서 husky pre-commit(`lint-staged`)에서 걸리지 않는다. 셀프 체크가 `pnpm check` 통과를 요구하고 이미 husky가 `eslint`에 물려 있으므로, ESLint에 통합되는 쪽을 골랐다.

**preset 선택 — `configs.recommended`**: 플러그인이 `recommended`와 `strict` 두 preset을 준다. `recommended`를 깔고 시작했다. 이 preset의 설계 의도가 우리 상황과 정확히 같다 — "이미 존재하는 프로젝트에 플러그인을 적용할 때 권장. `no-unknown-files`, `no-unknown-dependencies`, `no-ignored-dependencies`를 꺼두어 프로젝트 일부가 규칙을 안 지켜도 점진적으로 리팩토링할 수 있게 한다."

전환이 끝나지 않은 폴더(`api/ services/ store/ types/ utils/ lib/ components/`)는 어떤 element에도 잡히지 않는다. `strict`를 쓰면 이 미분류 파일이 전부 에러가 되어 마이그레이션 자체가 불가능해진다. `recommended`는 이들을 조용히 통과시키고, 레이어가 이사 오는 즉시 검증을 시작한다.

**S7 완료 게이트로 `strict` 승격**: 마이그레이션이 끝나면 `strict`로 올린다. `strict`는 `no-unknown-files`를 켜므로 **옮기기를 빠뜨린 파일이 기계적으로 드러난다.** 사람이 폴더를 훑으며 "다 옮겼나" 확인하는 것보다 확실하다.

**preset 적용 시 함정 둘** — 둘 다 하네스를 조용히 무력화한다.

1. `recommended.settings["boundaries/elements"]`가 **빈 배열**이다. 내 element 정의 뒤에 spread하면 정의가 지워진다. → 순서를 지켜 실제 정의로 덮는다.
2. flat config의 `rules` 객체는 병합이 아니라 **교체**다. `...boundaries.configs.recommended.rules`를 명시적으로 spread하지 않으면 `no-unknown-*`의 off 설정이 사라져 마이그레이션 중 에러가 쏟아진다.

**강제하는 규칙 두 개** (`eslint.config.mjs`)

| #   | 규칙                                                  | 구현                                                                        |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| ①   | 하위 레이어가 상위 레이어를 import 하지 않는다        | `default: "disallow"` + 레이어별 `allow.to.element.types` 화이트리스트      |
| ②   | 같은 레이어의 다른 슬라이스를 직접 import 하지 않는다 | `captured: { slice: "{{from.slice}}" }` — from 쪽 슬라이스와 같을 때만 허용 |

**하네스 검증 결과** — FSD 폴더가 아직 없어 규칙이 매칭할 대상이 0이다. 설정이 틀려도 조용히 통과할 수 있으므로 임시 fixture로 발동을 확인한 뒤 제거했다.

| 케이스                                                                   | 기대        | 결과                                         |
| ------------------------------------------------------------------------ | ----------- | -------------------------------------------- |
| `entities/cart` → `features/add-to-cart`                                 | 규칙 ① 위반 | ✅ `FSD 의존 방향 위반: entities → features` |
| `entities/cart` → `entities/wishlist`                                    | 규칙 ② 위반 | ✅ `FSD 의존 방향 위반: entities → entities` |
| `entities/cart` → `shared/api`                                           | 허용        | ✅ 무에러                                    |
| `features/add-to-cart` → `entities/cart`                                 | 허용        | ✅ 무에러                                    |
| `entities/cart/ui` → `entities/cart/model` (같은 슬라이스 세그먼트 협력) | 허용        | ✅ 무에러 (오탐 없음)                        |
| 전체 `pnpm check`                                                        | 기준선 유지 | ✅ exit 0                                    |

**~~막지 못하는 것~~ → 채점 피드백 반영 후 막는다**: Public API 우회(`@/entities/cart/model/useCartStore` 처럼 슬라이스 내부 경로 직접 참조)를 처음에는 "`index.ts`를 둘 슬라이스와 두지 않을 슬라이스가 섞여 규칙이 복잡해진다"는 이유로 넣지 않았다. **이 근거가 틀렸다.** 실제로 세어 보니 `entities` 3 · `features` 3 · `widgets` 1 이 예외 없이 전부 `index.ts`를 갖고 있고, 없는 곳은 `_pages`와 `shared` 뿐이라 element type 으로 깔끔하게 갈린다. 규칙 ③으로 추가했다 — 아래 "설계 리뷰 지적" 절 참조.

### B. 변경 반경 실험 — "검색·카테고리·정렬 조건 전체 초기화"

5단계 사고 실험을 실제 구현으로 증명한다. 요구사항: 목록 화면에 버튼을 두고, 누르면 검색어·카테고리·정렬·페이지가 모두 기본값으로 돌아간다.

> 아래 예상·실제 표에 나오는 `useProductListQuery.ts` 는 **이 실험 시점의 파일명**이다. 이후 채점 피드백을 반영하면서 `useProductFilterState.ts` 로 바뀌었다. 봉인한 예상을 사후에 고치지 않기 위해 당시 이름 그대로 둔다.

#### 구현 전 예상 — 착수 전에 커밋했다

| 관점                           | 예상                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 새 feature 슬라이스가 필요한가 | **불필요.** "조건 초기화"는 필터가 이미 소유한 상태를 되돌리는 행위다. 별도 사용자 행위 단위로 볼 만큼 독립적이지 않다                          |
| 수정할 슬라이스                | `features/product-filter` **한 곳, 두 파일** — `model/useProductListQuery.ts`(reset 액션), `ui/ProductFilterForm.tsx`(버튼 + 입력 draft 초기화) |
| 변경할 Public API              | **없음.** `useProductListQuery` 는 이미 `index.ts` 에 공개돼 있고 반환 객체에 키가 하나 늘 뿐이라 export 목록이 바뀌지 않는다                   |
| 새로 생길 의존                 | **없음.** 이미 있는 `ui → model`, `model → config` 안에서 끝난다. 레이어를 넘는 import 가 생기지 않는다                                         |
| 손대지 않을 것                 | `_pages/product-list/*`, `entities/*`, `widgets/*`, `shared/*`                                                                                  |

**관전 포인트**: `ProductFilterForm` 의 `searchDraft` 는 `useState(state.q)` 라 마운트 시점에만 초기화된다. URL 만 비우면 입력창에 이전 검색어가 남는다. 이 처리가 **필터 슬라이스 밖으로 새는지**가 이 실험의 핵심이다.

#### 구현 후 실제

| 관점              | 구현 전 예상                      | 실제                                                                                                   | 차이가 난 이유 |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------- |
| 수정한 슬라이스   | `features/product-filter` 두 파일 | ✅ 일치 — `model/useProductListQuery.ts`(+9), `ui/ProductFilterForm.tsx`(+16). 이 슬라이스 밖 수정 0건 | 차이 없음      |
| 변경한 Public API | 없음                              | ✅ 일치 — `index.ts` diff 0줄                                                                          | 차이 없음      |
| 새로 생긴 의존    | 없음                              | ✅ 일치 — 추가된 `import` 문 0건                                                                       | 차이 없음      |

**세 항목 모두 적중했다.** 새 기능 하나를 붙이는 데 슬라이스 하나, 파일 두 개로 끝났고 다른 레이어는 열어보지도 않았다. 5단계 사고 실험에서 "필터를 통째로 들어내면 폴더 하나"라고 답했던 응집이 반대 방향(추가)에서도 성립했다.

**관전 포인트였던 `searchDraft` 는 밖으로 새지 않았다.** URL 만 비우면 입력창에 이전 검색어가 남는 문제가 실제로 있었고, `ProductFilterForm` 안에서 `setSearchDraft('')` 를 함께 호출해 해결했다. 확정된 조건의 원본은 URL 이고 draft 는 이 폼의 임시값이므로, 둘을 함께 비우는 것도 폼의 일이다. 상위 레이어가 개입할 필요가 없었다.

**구현 중 내린 판단 두 가지**

| 판단                                                        | 근거                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resetFilters` 가 기본값을 하드코딩하지 않고 `null` 을 넘김 | nuqs 는 `null` 을 받으면 URL 에서 파라미터를 지우고 파서의 기본값으로 읽는다. `q: ''`, `sort: 'latest'` 처럼 적으면 `defaultParsers` 와 기본값이 두 벌이 된다 |
| 버튼 `disabled` 조건을 저장하지 않고 파생                   | `state` 와 `searchDraft` 에서 계산한다. "파생 가능한 값은 저장하지 않고 계산한다"는 규칙을 그대로 적용                                                        |

---

## AI 활용 기록

| 구간                      | AI가 한 것                                                                                             | 사람이 한 것                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 현재 구조 문제 도출       | import 그래프 스캔, 고아 파일·다중 소비자 파일 찾기, 문제 7개 정리                                     | 결과 확인                                                                                                                                                                                                                      |
| 결정표 10개 초안          | 후보 A/B와 트레이드오프 제시                                                                           | **5건 확정**: 데모 범위, store 분해, 타입 분해 방식, Public API 방침, `dialog`/`select`의 `shared/ui` 이동. 마지막 건은 근거("전역 레이어로 사용하는 컴포넌트")도 직접 제시. 나머지 5건은 AI 제안을 그대로 둔 상태이며 검토 전 |
| 목표 트리 · 이 문서 작성  | 초안 작성                                                                                              | 근거가 사실인지(파일:라인 인용) 확인                                                                                                                                                                                           |
| 마이그레이션 실행 (S1~S7) | 레이어 단위로 근거를 제시하고 승인 후 실행. 단계마다 `pnpm typecheck`, 레이어 끝에 `pnpm check`        | 각 레이어 진입 시 결정. `dialog`/`select`의 shared 이동, store 분해, `toggle` 복제 유지, 조합 지점(위젯 미생성), 필터 feature 승격, `toSearchQueryParams` 위치, `HomeResponse` 소유권 — 7건을 직접 판단                        |
| 기존 코드 중 AI 생성분    | `lib/query/get-query-client.ts`("AI 생성"), `services/products.ts`·`useProductOptions.ts`("AI가 작성") | 전자는 전환 대상, 후자 2개는 고아라 범위 제외                                                                                                                                                                                  |

### 설계 리뷰 지적 — 수용 / 반려

구조와 설계에 대한 지적만 기록한다. 받기로 계획한 시점은 두 번이었다.

1. **RFC 설계 리뷰** — 이 문서를 쓴 직후, 파일을 옮기기 전
2. **`architecture-review` SKILL 점검** — 마이그레이션(S7)이 끝난 뒤

| 계획한 시점   | 실제                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RFC 설계 리뷰 | **받지 않고 넘어갔다.** 파일 이동 전에 리뷰를 받았다면 결정표 #6(필터 feature 승격)과 #8(쿼리스트링 변환 위치)을 S6b·리뷰 후속에서 두 번 뒤집는 일이 줄었을 것이다 |
| S7 이후 점검  | 실시. `architecture-review` SKILL 의 4개 항목 전부 위반 0건 (위 절 참조)                                                                                           |

실제 지적은 **PR 채점**과 **코드 리뷰**에서 왔다. 아래에 기록한다.

| 시점      | 지적 내용                                                                    | 수용 / 반려                                       | 근거                                                                                                                                                                                                                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 과제 채점 | `_app` 미생성은 적절. 다만 **전환 트리거**를 정해두라                        | **수용**                                          | "`layout.tsx` 가 provider 배선을 넘어 조합을 시작할 때"라는 기준을 받았다. 전역 토스트 컨테이너, 분석 초기화, 인증 게이트, 실험군 분기가 붙으면 라우팅 진입점이 아니라 앱 조립 지점이 된다. 지금은 17줄에 폰트와 Providers 뿐이라 아직 멀다                                                                                                |
| 과제 채점 | 홈·목록 `queryOptions` 를 page 에 둔 판단은 적절                             | 지적 없음                                         | 조치 불필요                                                                                                                                                                                                                                                                                                                                |
| 과제 채점 | Public API 우회를 린트로 안 막은 것은 **반쪽짜리**. 생각보다 쉽게 기계화된다 | **수용 — 내 근거가 틀렸다**                       | "`index.ts` 를 둘 슬라이스와 두지 않을 슬라이스가 섞여 복잡하다"고 썼는데 세어 보니 섞여 있지 않았다. entities 3 · features 3 · widgets 1 이 예외 없이 전부 갖고 있고, 없는 곳은 `_pages` 와 `shared` 뿐이라 element type 으로 갈린다                                                                                                      |
| 과제 채점 | 필터를 feature 로 올린 건 괜찮으나 **`ProductListQuery` 는 목록 조회의 것**  | **수용 (구현 방식은 조정)**                       | 소유권 판단에 동의한다. 다만 "필터 feature 가 그걸 가져다 쓴다"를 문자 그대로 하면 `features → _pages` 역방향이라 하네스가 잡는다. 훅이 `query` 조립을 그만두고 `state` 만 반환하게 해 필터가 이 타입을 **아예 모르도록** 했다                                                                                                             |
| 코드 리뷰 | `api` 에 유틸이 왜 있나. 슬라이스 `lib` 세그먼트로 빼면 되지 않나            | **부분 수용 — 세그먼트는 유지, 파일 배치는 수정** | `lib` 이전은 반려했다. 매퍼는 `api` 세그먼트 정의에 포함되고, "순수 함수인가"는 세그먼트 판별 기준이 아니며, 백엔드 계약에 묶인 코드의 자리는 `api` 다. 그러나 **지적이 가리킨 냄새는 실재했다** — 백엔드 계약이 두 파일에 쪼개져 있었다. 변경 축으로 다시 갈랐다(A-7-1 절 참조). 냄새를 맡은 쪽이 원인 진단까지 맞을 필요는 없다는 사례다 |

#### 수용 ③ — Public API 우회를 하네스로 강제

`boundaries/entry-point` 전용 규칙은 v7 에서 deprecated 라, 권장대로 `boundaries/dependencies` 셀렉터로 표현했다. 슬라이스가 있는 레이어(`entities`/`features`/`widgets`)를 향하는 의존만 `fileInternalPath: "index.ts"` 를 요구하고, `_pages` 와 `shared` 는 제한하지 않는다.

**발동 확인** — 규칙이 조용히 꺼져 있어도 0건이 나오므로 프로브로 검증한 뒤 제거했다.

| 프로브                                                        | 기대                    | 결과      |
| ------------------------------------------------------------- | ----------------------- | --------- |
| `entities/cart` → `@/entities/wishlist`                       | 같은 레이어 슬라이스 간 | ✅ 에러   |
| `features/add-to-cart` → `@/entities/cart/model/useCartStore` | **Public API 우회**     | ✅ 에러   |
| `features/add-to-cart` → `@/features/toggle-wishlist`         | feature 간 직접 의존    | ✅ 에러   |
| 프로브 제거 후 전체                                           | 통과                    | ✅ exit 0 |

메시지도 고쳤다. 기존 "FSD 의존 방향 위반"은 우회 케이스에서 부정확했다 — 방향은 맞고 진입점이 틀린 것이기 때문이다. 세 경우를 모두 짚도록 바꿨다.

#### 수용 ④ — `ProductListQuery` 소유권 이전

| 이전                                                  | 이후                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `features/product-filter/model/types.ts` 가 타입 소유 | `_pages/product-list/model/types.ts` 가 소유                      |
| 훅이 `{ state, query, ...setters }` 반환              | 훅은 `{ state, ...setters }` 만 반환                              |
| 페이지가 훅에서 `query` 를 받아 씀                    | 페이지가 `state` 로 `query` 를 조립 (`pageSize` 도 여기서 붙는다) |
| 훅 이름 `useProductListQuery`                         | `useProductFilterState` 로 변경                                   |

**훅 이름을 바꾼 이유**: 반환값에 `query` 가 없는데 이름에 "Query" 가 남으면 페이지가 소유하는 `ProductListQuery` 와 겹쳐 두 개념이 헷갈린다. 이 훅이 관리하는 것은 필터의 URL 상태다.

**얻은 것**: 필터는 "사용자가 무엇을 골랐는가"까지만 알고, `pageSize` 처럼 사용자가 고르지 않는 값이 조회 조건에 붙는 일은 조회하는 쪽에서 일어난다. 쿼리스트링 변환을 페이지에 둔 판단과 같은 결이다.

### `architecture-review` SKILL — 작성 완료

`~/.claude/skills/architecture-review/SKILL.md`. **저장소 밖**이라 커밋에는 포함되지 않는다.

설계 원칙은 "구조적 판단만 내놓고 코드 수정안은 내지 않는다"이다. 수정 코드·파일 편집·네이밍 지적·리팩토링 제안을 명시적으로 금지했다. 구조 결정은 코드가 아니라 맥락에서 나오므로, 판정과 근거까지가 이 도구의 범위다.

점검 항목 넷: ① 하위→상위 import ② 같은 레이어 슬라이스 간 직접 import ③ entity 가 사용자 행위를 품는가 ④ shared 가 도메인을 아는가.

**오탐 방지 규칙을 넣었다.** 흔히 위반으로 오해되지만 아닌 것들 — 한 페이지에서만 쓰는 feature, 여러 슬라이스를 조합하는 컴포넌트, `index.ts` 없는 슬라이스, 만들지 않은 레이어 — 을 표로 명시했다. 이번 전환에서 내가 실제로 헷갈렸던 지점들이다.

**하네스와의 역할 분담도 적었다.** `eslint-plugin-boundaries` 가 이미 ①②를 잡으므로, SKILL 은 기계가 못 잡는 것에 집중한다 — Public API 우회, entity 안의 책임 혼재(파일 안 문제라 경로 규칙으로 안 잡힘), shared 의 도메인 결합(시그니처를 읽어야 판단됨).

**이 프로젝트에 적용한 결과: 4개 항목 전부 위반 0건.**

| 점검                                        | 결과                                      |
| ------------------------------------------- | ----------------------------------------- |
| ① `entities`·`shared` → 상위 레이어 import  | ✅ 0건                                    |
| ② 같은 레이어 슬라이스 간 직접 import       | ✅ 0건                                    |
| ③ `entities/product` 가 store 를 구독하는가 | ✅ 모름 (S2 에서 `actions` 슬롯으로 분리) |
| ④ `shared` 가 도메인 타입을 아는가          | ✅ 0건                                    |

---

## 체크리스트

- [x] 파일을 옮기기 **전에** RFC를 작성했는가 (커밋은 마이그레이션 착수 전 별도로)
- [x] 애매한 파일 5개 이상을 후보 비교 후 근거로 결정했는가 (10개)
- [ ] 상위→하위 import만 있고, 같은 레이어 슬라이스 간 · `entities → features` 역방향 import가 없는가 — S7 확인
- [x] barrel과 Public API의 차이를 알고 사용/미사용 결정의 의도를 기록했는가
- [x] 서버 · URL · 클라이언트 상태의 Source of Truth를 유지하고 같은 데이터를 여러 저장소에 복사하지 않았는가 (D 섹션)
- [ ] 경계로 전파할 에러와 인라인 처리할 에러의 기준이 표와 구현에서 일치하는가 — S8 확인
- [ ] 위시리스트 제거 시 삭제할 파일이 한 곳에 응집되어 있는가 — S9 확인
- [ ] `pnpm check`가 통과하고, AI로 생성한 부분을 표기·검토했는가 — S7 확인 (기준선은 통과 확인됨)
