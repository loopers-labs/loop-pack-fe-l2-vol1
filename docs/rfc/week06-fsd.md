# RFC: Round 6 Quests - 프론트엔드 시스템 설계

## 0. 동작 기준선 고정
### 홈과 상품 목록의 정상·로딩·에러·빈 상태

| 상태 | 기준선 동작 |
| --- | --- |
| 정상 | 상품 목록을 받으면 정상 노출 |
| 로딩 | "상품 목록을 불러오는 중…" 노출 |
| 에러 | 에러 화면이 나오기는 하나, 헤더까지 덮어버리는 에러 화면으로 노출 |

### 검색·카테고리·정렬·페이지네이션

| 기능 | 진입 경로 | 기준선 동작 |
| --- | --- | --- |
| 검색 | input 변경 · URL 직접 변경 | 키워드에 맞는 상품 검색 확인 |
| 카테고리 | 홈에서 카테고리 선택 · 셀렉트 박스 선택 · URL 직접 변경 | 카테고리 변경 확인 |
| 정렬 | 셀렉트 박스 선택 · URL 직접 변경 | 정렬 변경 확인 |

### URL 공유·새로고침·뒤로/앞으로 가기

| 시나리오 | 기준선 동작 |
| --- | --- |
| URL 공유 | URL로 직접 검색/카테고리/정렬 유지 확인 |
| 새로고침 | 검색/카테고리/정렬 유지 확인 |
| 뒤로/앞으로 가기 | 검색/카테고리/정렬 유지 확인 |

### 홈과 목록에서 장바구니·위시리스트 상태 동기화, 페이지 이동 중 Zustand 상태·헤더 개수 유지

| 시나리오 | 기준선 동작 |
| --- | --- |
| 상태 동기화 | 홈에서 담은 장바구니·위시리스트가 목록에서도 동일하게 반영 (양방향) |
| 페이지 이동 중 상태 유지 | 홈 ↔ 목록 이동해도 Zustand 장바구니·위시리스트 상태 유지 |
| 헤더 개수 유지 | 페이지 이동 후에도 헤더의 장바구니·위시리스트 개수 유지 |

### pnpm check 통과
- 통과 확인

## 1. RADIO작성

### R — Requirements

| 요구사항 | 보존할 동작 여부 | 하지 않을 것 여부 | 하지 않을 경우 그 이유 |
| --- | --- | --- | --- |
| select, dialog headless UI 구현 | O | X | - |
| API 응답을 Zustand에 복사하지 않는다 | O | X | - |
| /에서 배너·카테고리·인기 상품·신상품을 볼 수 있다. | O | X | - |
| /products에서 조건에 맞는 상품 목록과 전체 개수, 현재 페이지를 볼 수 있다. | O | X | - |
| 요청 중·요청 실패·검색 결과 없음이 같은 화면으로 처리되지 않는다. | O | X | - |
| 홈 상품이 비어도 배너와 카테고리는 유지된다. | O | X | - |
| 검색·카테고리·정렬·페이지가 URL과 화면에 일치한다. | O | X | - |
| 카테고리나 검색 조건을 바꾸면 1페이지로 돌아간다. | O | X | - |
| 새로고침·URL 공유·뒤로 가기·앞으로 가기 후 같은 조건이 복원된다. | O | X | - |
| 지원하지 않는 값이 들어와도 parser의 기본값과 API 계약을 벗어나지 않는다. | O | X | - |
| 홈에서 담은 상품이 목록에서도 담긴 상태로 보인다. | O | X | - |
| 홈과 목록 어디에서 토글해도 헤더 개수가 즉시 갱신된다. | O | X | - |
| 다른 페이지로 이동해도 클라이언트 상태가 유지된다. | O | X | - |
| 같은 값을 서버 상태·URL 상태·Zustand에 중복 저장하지 않는다. | O | X | - |
| 장바구니와 위시리스트를 새로고침 후에도 복원한다. | O | X | - |
| App Router 서버 프리패치 | O | X | - |
| 검색어 debounce 검색 | O | X | - |
| 다음 페이지 prefetch | O | X | - |
| 상품 목록으로 이동하기 전 prefetch | O | X | - |
| 페이지 변경 중 기존 목록 유지 | O | X | - |
| 전체 페이지를 새로고침하지 않는 오류 재시도 경험 | X | O | 홈화면의 경우 기존 버그이며, 이번 과제인 구조 변경에 먼저 집중하기 위해 후 순위로 미룸 |


### A — Architecture
#### 현재 구조에서 실제로 겪는 문제 3개 이상
1. hooks/productListSearchParams.ts가 주로 hooks에서 쓰다보니 hooks에 들어가 버리는 실수를 했는데, 결과적으로 hook말고도 다른 곳에도 사용하고 있어서 어디에 묶여있는지 파악하기 힘든 상태
2. app/products/ProductListSection.tsx는 page의 일부인데, 다른 페이지의 일부는 components/commerce/** 에 있는 상태. 기준이 명확하지 않아 위치가 명확하지 않음
3. 디렉토리명이 기술적인 역할 명이라 어떤 기능을 어떻게 수행하나를 볼 때 흩어져서 확인이 어려움. 예를들어 상품 목록 가져오는 부분은 `hooks/productListSearchParams.ts`(URL 파싱) + `queries/products.ts`(queryOptions) + `components/commerce/productListOptions.ts`(카테고리·정렬 상수/라벨/타입가드) 세 군데에 나뉘어 있음. "상품 목록 조건이 어디서 정의되나"를 보려면 폴더 3개를 오가야 함.

#### 사용할 레이어와 선택한 근거
**app** — 앱 전역 환경 설정·공용 로직을 관리하는 곳이라 사용. `providers.tsx`, `globals.css` 같은 내용이 들어감. layer명과 파일명으로 구분된다고 생각해서 segment는 생략.

**pages** — 페이지가 있는 앱이라 사용. 홈·상품 목록을 slice로 두고 `ui`·`api` segment를 가짐. pagination은 features/pages 후보로 봤으나, 도메인 없는 범용 UI로 사용할수 있 `shared/ui` 로 이동(page/onPageChange props만 받는 순수 컴포넌트).

**widgets** — 헤더·상품 카드 같은 독립적 UI 블록이 있어서 추가. segment는 `ui` 만.

**features** — 사이트에 사용자 인터랙션이 있으니 사용. 카테고리 셀렉트/정렬 셀렉트는 하는 일 차이가 거의 없어 하나로 합칠지 고민했으나, 엄밀히 따지면 다른 기능이라 생각되어 별도 feature로 분리

**entities** — 도메인 개념(`product`·`cart`·`wishlist`)을 담음. `ProductCard` 를 slot 패턴으로 여기 두려 했으나, 장바구니·위시리스트 feature 를 조합하는 UI라 `widgets/product-card` 로 올렸다 — widget 은 feature 를 직접 import 할 수 있어 slot 우회가 필요 없다. entities 에는 도메인 모델·api 만 남긴다. 장바구니·위시리스트 store 는 같은 Zustand 를 쓴다는 이유만으로 합치지 않고, 변경 이유가 다르므로 `cart`·`wishlist` 로 분리한다(각자 독립 store).

**shared** — 도메인과 무관한 공용 훅(`useDebouncedValue`)과 4주차 headless UI가 있어 추가.

#### 현재/목표 폴더 트리

**현재**

```text
src
├── app/
│   ├── api/
│   │   ├── _data/commerce.ts
│   │   ├── home/route.ts
│   │   └── products/route.ts
│   ├── products/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── ProductListSection.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── commerce/
│   │   ├── CommerceHeader.tsx
│   │   ├── CommerceHeaderCounts.tsx
│   │   ├── HomeContent.tsx
│   │   ├── Pagination.tsx
│   │   ├── PrefetchCategoryLink.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductCardActions.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductListFilters.tsx
│   │   ├── ProductListResult.tsx
│   │   ├── productListOptions.ts
│   │   └── commerce.module.css
│   └── ui/
│       ├── dialog/
│       └── select/
├── hooks/
│   ├── productListSearchParams.ts
│   ├── useProductListSearchParams.ts
│   └── useDebouncedValue.ts
├── lib/
│   └── queryClient.ts
├── queries/
│   ├── home.ts
│   └── products.ts
├── services/
│   ├── commerce.ts
│   ├── getBaseUrl.ts
│   └── requestJson.ts
├── stores/
│   └── commerceStore.ts
├── types/
│   └── commerce.ts
├── utils/
│   ├── index.ts
│   └── productList.ts
└── examples/                     ← 학습용 예제 (전환 범위 밖)
```

**목표**

```text
src
├── app/
│   ├── api/
│   │   ├── _data/commerce.ts
│   │   ├── home/route.ts
│   │   └── products/route.ts
│   ├── products/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   └── page.tsx
├── _app/                            ← FSD app 레이어 (전역 설정 관련)
│   ├── providers.tsx                ← 현재: app/providers.tsx
│   ├── queryClient.ts               ← 현재: lib/queryClient.ts
│   └── styles/globals.css           ← 현재: app/globals.css
├── _pages/                          ← FSD pages, app/**/page.tsx 에서 렌더 (src/pages 금지: Pages Router 충돌)
│   ├── home/
│   │   ├── ui/HomeContent.tsx       ← 현재: components/commerce/HomeContent.tsx
│   │   ├── api/home.ts              ← 현재: queries/home.ts + services/commerce.ts 의 getHome + HomeResponse 타입
│   │   └── index.ts
│   └── products/
│       ├── ui/
│       │   ├── ProductList.tsx          ← 현재: components/commerce/ProductList.tsx
│       │   ├── ProductListSection.tsx   ← 현재: app/products/ProductListSection.tsx
│       │   ├── ProductListResult.tsx    ← 현재: components/commerce/ProductListResult.tsx
│       │   ├── ProductListFilters.tsx   ← 현재: components/commerce/ProductListFilters.tsx (검색·카테고리·정렬 feature 조합점)
│       │   └── ProductGrid.tsx          ← 현재: components/commerce/ProductGrid.tsx
│       ├── model/
│       │   ├── productListParsers.ts           ← 현재: hooks/productListSearchParams.ts 의 nuqs 파서만
│       │   └── useProductListSearchParams.ts   ← 현재: hooks/useProductListSearchParams.ts
│       └── index.ts
├── widgets/                         ← FSD widgets 레이어 (독립적 UI 블록)
│   ├── commerce/
│   │   ├── ui/
│   │   │   ├── CommerceHeader.tsx        ← 현재: components/commerce/CommerceHeader.tsx
│   │   │   └── CommerceHeaderCounts.tsx  ← 현재: components/commerce/CommerceHeaderCounts.tsx
│   │   └── index.ts
│   └── product-card/
│       ├── ui/ProductCard.tsx       ← 현재: components/commerce/ProductCard.tsx (features 버튼 직접 조합)
│       └── index.ts
├── features/                        ← FSD features 레이어 (사용자 인터랙션)
│   ├── add-to-cart/
│   │   ├── ui/AddToCartButton.tsx   ← 현재: components/commerce/ProductCardActions.tsx 에서 분리
│   │   └── index.ts
│   ├── toggle-wishlist/
│   │   ├── ui/WishlistButton.tsx    ← 현재: components/commerce/ProductCardActions.tsx 에서 분리
│   │   └── index.ts
│   ├── search/
│   │   ├── ui/SearchInput.tsx       ← 현재: components/commerce/ProductListFilters.tsx 에서 분리
│   │   └── index.ts
│   ├── category-select/
│   │   ├── ui/CategorySelect.tsx    ← 현재: components/commerce/PrefetchCategoryLink.tsx + ProductListFilters.tsx 에서 분리
│   │   └── index.ts
│   └── sort-select/
│       ├── ui/SortSelect.tsx        ← 현재: components/commerce/ProductListFilters.tsx 에서 분리
│       └── index.ts
├── entities/                        ← FSD entities 레이어 (도메인 개념)
│   ├── product/
│   │   ├── model/
│   │   │   ├── product.ts               ← 현재: types/commerce.ts 의 Product·Category·CategoryId·ProductSort·ProductListQuery
│   │   │   ├── productListOptions.ts    ← 현재: components/commerce/productListOptions.ts (카테고리·정렬 값/라벨/타입가드)
│   │   │   └── productListQuery.ts      ← 현재: utils/productList.ts + hooks/productListSearchParams.ts 의 목록 조회 조건 정의·정규화 로직(defaults·normalize·buildSearchParams·resolve·buildDefault·clamp·ProductListParams)
│   │   ├── api/
│   │   │   ├── productQueries.ts    ← 현재: queries/products.ts (TanStack Query queryOptions)
│   │   │   └── fetchProducts.ts     ← 현재: services/commerce.ts 의 getProducts (HTTP fetch, productQueries 내부용)
│   │   └── index.ts
│   ├── cart/                        ← 장바구니 (변경 이유가 wishlist 와 달라 분리)
│   │   ├── model/store.ts           ← 현재: stores/commerceStore.ts 의 cartIds Set
│   │   └── index.ts
│   └── wishlist/
│       ├── model/store.ts           ← 현재: stores/commerceStore.ts 의 wishlistIds Set
│       └── index.ts
└── shared/                          ← FSD shared 레이어 (도메인과 무관한 공통 코드)
    ├── ui/
    │   ├── dialog/                  ← 현재: components/ui/dialog/
    │   ├── select/                  ← 현재: components/ui/select/
    │   └── pagination/
    │       ├── Pagination.tsx           ← 현재: components/commerce/Pagination.tsx
    │       └── Pagination.module.css    ← commerce.module.css 에서 분리 (도메인 스타일 결합 제거)
    ├── lib/
    │   ├── useDebouncedValue.ts     ← 현재: hooks/useDebouncedValue.ts
    │   └── formatPrice.ts           ← 현재: utils/index.ts
    └── api/
        ├── requestJson.ts           ← 현재: services/requestJson.ts
        └── getBaseUrl.ts            ← 현재: services/getBaseUrl.ts
```

#### 허용/금지 import 예시
- FSD 기본 규칙에 따라 상위 레이어는 하위 레이어만, 그것도 public API를 통해서만 import 한다. slice가 있는 레이어(pages/widgets/features/entities)는 slice의 `index.ts` 를, slice가 없는 `shared` 는 세그먼트별 public API(`shared/ui`·`shared/api`·`shared/lib`)를 통한다. 같은 레이어 slice 간 직접 import는 금지.
- public API 규칙은 slice 경계를 넘을 때만 적용된다. 같은 slice 안의 segment(예: `ui`↔`model`↔`api`)끼리는 `index.ts` 를 거치지 않고 상대경로로 직접 import 한다.

```ts
// ✅ _pages/products(pages) → widgets·entities (하위 레이어, public API)
//    파일: _pages/products/ui/ProductGrid.tsx
import { ProductCard } from "@/widgets/product-card";
import { productQueries } from "@/entities/product";

// ✅ 같은 slice 안 segment 끼리는 상대경로 (ui → 같은 slice 의 model)
//    파일: _pages/products/ui/ProductListFilters.tsx
import { useProductListSearchParams } from "../model/useProductListSearchParams";

// ❌ 내부 파일 직접 import (public API 우회) — index.ts 를 거쳐야 함
//    파일: _pages/products/ui/ProductGrid.tsx
import { ProductCard } from "@/widgets/product-card/ui/ProductCard";

// ❌ 아래→위 (features → pages)
//    파일: features/category-select/ui/CategorySelect.tsx
import { ProductListSection } from "@/_pages/products";

// ❌ 같은 레이어 slice 간 cross-import (entities → entities)
//    파일: entities/cart/model/store.ts
import { useWishlistStore } from "@/entities/wishlist";
```

#### 단계별 마이그레이션 계획과 검증 방법

공식 가이드 [Migration from a custom structure](https://feature-sliced.design/kr/docs/guides/migration/from-custom) 의 순서를 이 프로젝트 결정에 맞춰 적용. 한 번에 다 옮기지 않고, 각 단계 끝에서 아래 [검증](#검증)을 통과시킨 뒤 다음으로 넘어간다.

1. **페이지 단위로 분리** — `_pages/home`·`_pages/products` 슬라이스를 만들고 페이지 컴포넌트를 옮긴다. 각 슬라이스에 `index.ts` 진입점 구성, `app/**/page.tsx` 는 이를 렌더만 한다. 이 단계에선 페이지 간 import 를 잠시 허용한다.
2. **페이지 외부 코드 분리** — 페이지를 import 하지 않는 코드는 `shared` 후보로, 페이지를 import 하고 전역 설정·프로바이더를 담는 코드는 `_app`(`providers.tsx`·`queryClient.ts`·`globals.css`)로 모은다.
3. **페이지 간 cross-import 해결** — 로직이 페이지마다 다르면 복사, 여러 페이지가 실제 공유하면 아래 레이어로 내린다. 이 프로젝트: 상품 queryOptions 는 category-select(feature)가 (홈·헤더의 카테고리 링크에서) prefetch 하려고 **import** 하므로, 그 feature 보다 아래인 `entities/product/api` 로 내려 하향 import 로 만든다(`_pages/products` 에 두면 feature→page upward import 위반).
4. **shared 최소화 / 소유 계층 정리** — 단일 페이지 전용 코드는 페이지 슬라이스로 되돌리고, 아래 계층이 쓰는 코드는 그 계층으로 내린다. 이 프로젝트: 상품 **목록 조회 조건 정의·정규화 로직**(`utils/productList.ts` 의 defaults·normalize·buildSearchParams + `hooks/productListSearchParams.ts` 의 resolve·buildDefault·clamp·`ProductListParams`)은 페이지뿐 아니라 entity(`productQueries`)·category-select feature(prefetch)도 써서, 페이지에 두면 상향 import 가 된다 → `entities/product/model/productListQuery.ts` 로 내린다. `getProducts` 도 `buildSearchParams` 를 써서 `services↔entities` 순환을 피하려 함께 `entities/product/api/fetchProducts.ts` 로 옮긴다(어차피 상품 fetch = entity 소유). 페이지에는 순수 페이지 전용인 nuqs 파서(`productListParsers.ts`)와 URL 바인딩 훅(`useProductListSearchParams.ts`)만 `_pages/products/model` 로 남는다.
5. **segment 정리** — 남은 코드를 `ui`·`api`·`model`·`lib` 로 가른다. 기술 역할로 나뉜 최상위 폴더(`components`·`hooks`·`services`·`queries`·`utils`·`stores`·`types`, `lib` 은 2단계에서 비움)를 제거한다. (`getProducts` 는 원래 이 단계에서 `services→entities/product/api` 로 옮길 대상이나, 4단계에서 목록 조회 조건 정의·정규화 로직을 entity 로 내리면서 함께 앞당겼다 — `getProducts` 가 `buildProductListSearchParams`(이 로직)를 쓰는데 이 로직만 entity 로 가면 `getProducts`(services)→로직(entity)→`getProducts`(services) 식으로 `services↔entities` 순환 참조가 생기므로, 둘을 같은 단계에 함께 옮겨 순환을 애초에 만들지 않았다.) 10개 컴포넌트가 공유하던 `commerce.module.css` 는 각 컴포넌트 옆으로 쪼갠다.
6. **공유 상태를 entities 로** — `commerceStore` 를 변경 이유가 다른 두 도메인으로 쪼개 `entities/cart/model`·`entities/wishlist/model` 로 내린다(각자 독립 store). `cart` 는 `wishlist` 를 모르고, 헤더 위젯만 둘을 함께 읽는다 — 세 소비처(각 feature + 헤더)가 하향 import 하게 된다.
7. **widgets/features 분리** — 헤더는 `widgets/commerce` 로, `ProductCardActions`·`ProductListFilters` 는 add-to-cart·toggle-wishlist·search·category-select·sort-select feature 로 쪼갠다. `ProductCard` 는 `widgets/product-card` 로 올려 장바구니·위시리스트 feature 버튼을 직접 조합한다(slot 불필요).
8. **shared/ui 정리** — `dialog`·`select` 헤드리스 UI 는 비즈니스 로직 없이 순수 UI 만 남긴다. `Pagination`(도메인·URL 모르는 순수 컴포넌트)은 `shared/ui/pagination` 으로 옮기고 스타일을 `commerce.module.css` 에서 분리한다.

##### 검증

테스트가 완비돼 있지 않으므로, 각 단계 후 **실행 중인 사이트에서 [동작 기준선](#0-동작-기준선-고정)을 직접 확인**한다.

- 홈·상품 목록의 정상/로딩/에러 상태
- 검색·카테고리·정렬·페이지네이션 (input·셀렉트·URL 직접 변경)
- URL 공유·새로고침·뒤로/앞으로 가기 후 조건 복원
- 장바구니·위시리스트 상태 동기화와 헤더 개수 유지 (페이지 이동 포함)

마이그레이션 완료후 FSD 레이어 규칙·import 경계는 공식 FSD 린터 **Steiger** 로 검증한다.

###### 단계별 검증 기록

각 단계: `pnpm check` 통과 + [§0 동작 기준선](#0-동작-기준선-고정)의 해당 영역 브라우저 확인. 통과면 특이사항이 있을경우만 적는다(전체 목록 재기술 X).

**1단계 (페이지 단위 분리)** — 통과. 특이사항: 로딩/에러 경계(`page.tsx`·`error.tsx`·`layout.tsx`)는 미변경이라 구조 보존(강제 트리거 생략).

**2단계 (페이지 외부 코드 → `_app`)** — 통과. `providers.tsx`·`queryClient.ts`(+테스트 2)·`globals.css`(→`styles/`) 이동. `lib/` 가 비워지게 되므로 디렉토리째 제거.

**3단계 (페이지 간 cross-import 해결)** — 통과. 상품 queryOptions(`queries/products.ts`) → `entities/product/api`, 소비처 8개를 `@/entities/product` 로. 특이사항: `HomeContent → ProductGrid` cross-import 는 미해소 — ProductGrid 는 widget 계층 아래로 못 내려가므로 7단계에서 `widgets/product-card` 로 co-locate 해 해소(목표 트리 ProductGrid 위치 보정 필요).

**4단계 (shared 최소화 / 소유 계층 정리)** — 통과. `entities/product/model/productListQuery.ts`, `getProducts` → `entities/product/api/fetchProducts.ts`, 페이지엔 `productListParsers`·`useProductListSearchParams`. 
- 특이사항: RFC 원안(`_pages/products` lib/model 로)이 3단계 entity 결정과 충돌해 entity→page·feature→page 상향 import 를 유발 → **엔티티 중심으로 보정**(트리·매핑표·결정표·Interface·본 계획서 함께 갱신). `getProducts` 는 `services↔entities` 순환을 피하려 4단계에 함께 이동.

**5단계 (segment 정리)** — 통과(테스트 69개·build). `queries/`·`services/`·`hooks/`·`utils/`·`types/` 5개 기술 폴더 제거: home api(`_pages/home/api/home.ts` = homeQueries+getHome+`HomeResponse`), `shared/api`(getBaseUrl·requestJson·`ApiErrorResponse`), `shared/lib`(useDebouncedValue·formatPrice), `entities/product/model`(`product.ts` 도메인 타입·productListOptions), `productListOptions`→entity. 배치 결정: `MockApiScenario`→`app/api/_data/commerce.ts`(mock 전용), `ProductListResponse`→`api/fetchProducts.ts`(DTO를 fetch 옆), 미사용 `getErrorMessage` 삭제. 특이사항: `stores/`(6)·`components/**`(7·8)·`commerce.module.css` 분해는 컴포넌트 최종 위치 확정 후라야 해서 **6·7·8단계로 미룸**.

#### 파일 매핑표 (이동하는 파일 + 그 자리에 남기는 파일)

| 현재 위치 | 목표 위치 | 레이어 / 슬라이스 / 세그먼트 | 이동 또는 유지하는 이유 |
| --- | --- | --- | --- |
| `app/providers.tsx` | `_app/providers.tsx` | app / — / — | 앱 전역 프로바이더 |
| `app/globals.css` | `_app/styles/globals.css` | app / — / styles | 앱 전역 스타일 |
| `lib/queryClient.ts` | `_app/queryClient.ts` | app / — / — | 앱 전역 QueryClient 생성·설정 |
| `components/commerce/HomeContent.tsx` | `_pages/home/ui/HomeContent.tsx` | pages / home / ui | 홈 전용 조합 UI |
| `queries/home.ts` | `_pages/home/api/home.ts` | pages / home / api | 홈 전용 queryOptions |
| `app/products/ProductListSection.tsx` | `_pages/products/ui/ProductListSection.tsx` | pages / products / ui | 상품 목록 페이지 서버 조합 |
| `components/commerce/ProductList.tsx` | `_pages/products/ui/ProductList.tsx` | pages / products / ui | 상품 목록 전용 |
| `components/commerce/ProductListResult.tsx` | `_pages/products/ui/ProductListResult.tsx` | pages / products / ui | 상품 목록 전용 |
| `components/commerce/ProductGrid.tsx` | `_pages/products/ui/ProductGrid.tsx` | pages / products / ui | 상품 목록 레이아웃 |
| `components/commerce/ProductListFilters.tsx` | `_pages/products/ui/ProductListFilters.tsx` | pages / products / ui | 필터 조합점만 남김(컨트롤은 features로 분리) |
| `hooks/productListSearchParams.ts` (nuqs 파서) | `_pages/products/model/productListParsers.ts` | pages / products / model | 페이지 URL 스키마 바인딩(페이지 전용) |
| `hooks/productListSearchParams.ts` (resolve·buildDefault·clamp·`ProductListParams`) | `entities/product/model/productListQuery.ts` | entities / product / model | entity·feature 도 쓰는 목록 조회 조건 정의·정규화 로직이라 페이지에 두면 상향 import |
| `hooks/useProductListSearchParams.ts` | `_pages/products/model/useProductListSearchParams.ts` | pages / products / model | 상품 목록 URL 상태 훅(페이지 전용) |
| `utils/productList.ts` (defaults·normalize·buildSearchParams) | `entities/product/model/productListQuery.ts` | entities / product / model | 이 조회 조건 정의·정규화 로직을 entity·feature 가 소비 → 페이지 아래 entity 로 |
| `components/commerce/CommerceHeader.tsx` | `widgets/commerce/ui/CommerceHeader.tsx` | widgets / commerce / ui | 독립 UI 블록(헤더) |
| `components/commerce/CommerceHeaderCounts.tsx` | `widgets/commerce/ui/CommerceHeaderCounts.tsx` | widgets / commerce / ui | 헤더 개수 표시 |
| `components/commerce/ProductCard.tsx` | `widgets/product-card/ui/ProductCard.tsx` | widgets / product-card / ui | 장바구니·위시리스트 feature 를 직접 조합하는 UI |
| `components/commerce/ProductCardActions.tsx` | `features/add-to-cart/ui/` + `features/toggle-wishlist/ui/` | features / add-to-cart·toggle-wishlist / ui | 담기·위시토글 인터랙션 2개로 분리 |
| `components/commerce/PrefetchCategoryLink.tsx` | `features/category-select/ui/` | features / category-select / ui | 카테고리 선택 인터랙션 |
| `components/commerce/ProductListFilters.tsx` (검색·카테고리·정렬 컨트롤) | `features/search·category-select·sort-select/ui/` | features / … / ui | 필터 내 각 컨트롤을 feature 로 분리 |
| `components/commerce/productListOptions.ts` | `entities/product/model/productListOptions.ts` | entities / product / model | 카테고리·정렬 도메인 상수(두 셀렉트 feature 공유) |
| `queries/products.ts` | `entities/product/api/productQueries.ts` | entities / product / api | 상품 도메인 조회 설정인데, 상품 목록 페이지 밖의 카테고리 링크(홈·헤더)가 prefetch 로 import 해서 product entity 소유로 |
| `services/commerce.ts` 의 `getProducts` | `entities/product/api/fetchProducts.ts` | entities / product / api | 상품 fetch = entity 소유. `buildSearchParams`(조회 조건 로직, entity/model)를 써서 4단계에 함께 이동 — services 유지 시 `services↔entities` 순환 |
| `stores/commerceStore.ts` | `entities/cart/model/store.ts` + `entities/wishlist/model/store.ts` | entities / cart·wishlist / model | 변경 이유가 다른 두 도메인이라 store 를 각자로 분리 |
| `types/commerce.ts` | 도메인 타입 → `entities/product/model`, 응답 DTO → 각 api 옆 | entities / product / model 외 | 소유자별로 분해: `Product`·`Category`·`CategoryId`·`ProductSort`·`ProductListQuery` → `entities/product/model/product.ts`, `HomeResponse` → `_pages/home/api/home.ts`, `ProductListResponse` → `entities/product/api/fetchProducts.ts`, `ApiErrorResponse` → `shared/api/requestJson.ts`(공통 에러 규약), `MockApiScenario` → `app/api/_data/commerce.ts`(mock 라우트 전용) |
| `components/ui/dialog/` | `shared/ui/dialog/` | shared / — / ui | 도메인 무관 헤드리스 UI |
| `components/ui/select/` | `shared/ui/select/` | shared / — / ui | 도메인 무관 헤드리스 UI |
| `components/commerce/Pagination.tsx` | `shared/ui/pagination/Pagination.tsx` | shared / — / ui | 도메인 없는 범용 UI(props 만 받는 순수 컴포넌트) |
| `hooks/useDebouncedValue.ts` | `shared/lib/useDebouncedValue.ts` | shared / — / lib | 도메인 무관 유틸 훅 |
| `utils/index.ts` (`formatPrice`·`perUnitPrice`) | `shared/lib/formatPrice.ts` | shared / — / lib | 도메인 무관 포맷 유틸 (미사용 `getErrorMessage` 는 삭제) |
| `services/commerce.ts` 의 `getHome` | `_pages/home/api/home.ts` | pages / home / api | 홈 전용 조합 응답 조회 → 홈 페이지가 소유 |
| `services/getBaseUrl.ts` | `shared/api/getBaseUrl.ts` | shared / — / api | API 인프라 |
| `services/requestJson.ts` | `shared/api/requestJson.ts` | shared / — / api | API 인프라 |
| `components/commerce/commerce.module.css` | 각 컴포넌트 옆으로 해체 | (분산) | 10개 컴포넌트 공유 CSS 를 컴포넌트별 co-locate 로 분산 |
| `app/page.tsx`·`layout.tsx`·`error.tsx` | 유지 | app (Next 라우팅) | Next 라우팅 진입점 |
| `app/products/{page,layout,error}.tsx` | 유지 | app (Next 라우팅) | Next 라우팅 진입점 |
| `app/api/**` (`home`·`products/route.ts`, `_data/commerce.ts`) | 유지 | app / api | Route Handler·mock, 전환 범위 밖 |
| `examples/` | 유지 | — | 학습 예제, 전환 범위 밖 |

#### 애매한 파일 5개 이상 결정표

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
| --- | --- | --- | --- | --- |
| `ProductCard` | `entities/product/ui` (slot 패턴) | `widgets/product-card` | **`widgets/product-card`** | 장바구니·위시리스트 feature 를 조합하는 UI — 여러 경로가 만나는 조합 지점이자 행위까지 포함한 완성된 카드이므로 widget |
| `Pagination` | `_pages/products/ui` (페이지 전용) | `shared/ui` | **`shared/ui/pagination`** | 도메인·URL 을 모르는 순수 컴포넌트(`page`·`onPageChange` props 만)이므로  범용 UI로 결정. |
| 상품 queryOptions (`queries/products.ts`) | `_pages/products/api` | `entities/product/api` | **`entities/product/api`** | category-select(feature)가 홈·헤더의 카테고리 링크에서 상품 목록을 prefetch 하려고 import — 페이지 slice(`_pages/products`)에 두면 feature→page upward import 위반이라 한 층 아래 entities 로 내림 |
| 상품 목록 조회 조건 정의·정규화 로직 (`utils/productList.ts` + `productListSearchParams.ts` 의 순수 함수) | `_pages/products`(lib/model) | `entities/product/model` | **`entities/product/model`**(`productListQuery.ts`) | defaults·normalize·buildSearchParams·resolve·buildDefault 를 entity(`productQueries`·`getProducts`)와 category-select feature(prefetch)가 소비 → 페이지에 두면 상향 import. nuqs 파서·URL 훅만 페이지 전용으로 남김 |
| 장바구니·위시리스트 store (`commerceStore`) | 한 entity 로 합침 (`entities/commerce`, 같은 Zustand store) | `entities/cart` + `entities/wishlist` 분리 | **`cart`·`wishlist` 분리** | 저장 방식이 같아도 변경 이유가 다르면 나눈다. 위치가 entities 인 것은 두 feature + 헤더 위젯이 함께 소비 → feature 에 두면 cross-import 라 한 층 아래로 |
| 카테고리 셀렉트 / 정렬 셀렉트 | 하나의 feature 로 합침 | `category-select`·`sort-select` 분리 | **분리** | 하는 일은 비슷해도 바꾸는 URL 상태와 값 집합이 서로 달라 다른 기능 |
| `productListOptions.ts`| `entities/product/config` | `entities/product/model` | **`entities/product/model`** | FSD `config` 는 설정 파일·feature flag 자리. 카테고리·정렬 값은 도메인 관련, 타입가드=검증이라 `model`이 정의에 맞다고 판단. |
| 도메인 fetch (`services/commerce.ts` 의 `getHome`·`getProducts`) | `shared/api` (services 통째로) | 도메인별 소유처로 분리 | **분리** | `shared/api` 는 http 클라이언트·공통 규약만. 도메인 조회 함수는 그 도메인이 소유 → `getProducts`→`entities/product/api`, `getHome`→`_pages/home/api`. `requestJson`·`getBaseUrl` 만 shared 유지 |

### D — Data Model

#### 상태 분류표 (5주차 표를 새 구조로 갱신)

폴더를 옮기면서 서버 응답을 Zustand에 복사하거나, URL 상태를 별도 `useState`에 동기화하면 안 된다.

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 이동 후에도 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과 | 서버/TanStack Query | 목록: `entities/product/api`(queryOptions) · 홈: `_pages/home/api`(queryOptions). 둘 다 서버에서 prefetch→`HydrationBoundary`, 클라이언트는 `useSuspenseQuery`. QueryClient 는 `_app` | 홈, 상품 목록 | 응답을 Zustand·`useState` 로 복사하지 않고 Query 캐시만 단일 원본으로 읽는다. 로딩·에러·빈 결과는 쿼리 상태 |
| 검색·정렬·페이지 | URL/nuqs | `_pages/products/model`(nuqs 파서·훅) | 상품 목록 | `useQueryStates` 로 URL 에서 직접 읽어 별도 `useState` 미러를 두지 않는다. queryKey 도 이 값에서 파생 → URL·요청·화면이 한 원본 |
| 장바구니·위시리스트 | Zustand | `entities/cart/model`·`entities/wishlist/model`(각자 독립 store) | 헤더, 상품 행위 UI | 담긴 상품 **id `Set`** 만 저장. 헤더 개수는 `.size` 로 파생(별도 count 상태 없음), 상품 상세는 서버가 원본이라 복사하지 않음 |
| Dialog 열림 여부 | React 로컬 상태 | 해당 UI slice 의 컴포넌트 로컬(`useState`). 헤드리스 UI 는 `shared/ui/dialog`, 열림 상태는 사용하는 쪽 로컬 | 해당 UI | 한 화면 수명이라 전역·URL 로 올리지 않고 컴포넌트 로컬에만 둔다 |

### I — Interface

**각 슬라이스가 공개할 값과 숨길 구현 세부**


| 슬라이스 | 공개(`index.ts` 가 export) | 숨기는 구현 세부 |
| --- | --- | --- |
| `entities/product` | `Product`·`Category`·`CategoryId`·`ProductSort` 타입(`model/product.ts`), `CATEGORY_VALUES`·`SORT_VALUES`·`*_LABELS`·`isCategoryValue`·`isSortValue`(`model/productListOptions.ts`), 목록 조회 조건 정의·정규화 로직 `PRODUCT_LIST_DEFAULTS`·`FIRST_PAGE`·`ProductListParams`·`normalizeProductListQuery`·`resolveProductListQuery`·`buildDefaultProductListQuery`·`clampPageToLowerBound`(`model/productListQuery.ts`), `productQueries`(`api/productQueries.ts`) | `getProducts` fetch 구현(`api/fetchProducts.ts` 내부, `productQueries` 만 사용), `buildProductListSearchParams`(로직 내부용) |
| `entities/cart` | cart store 훅(`useCartStore`)과 파생 셀렉터(`isInCart`, 개수)(`model/store.ts`) | store 내부가 id `Set<string>` 이라는 구조 |
| `entities/wishlist` | wishlist store 훅(`useWishlistStore`)과 셀렉터(`isWishlisted`, 개수)(`model/store.ts`) | 〃 (cart 를 모름) |
| `widgets/product-card` | `ProductCard`(`ui/ProductCard.tsx`) | 내부에서 조합하는 feature 버튼(`AddToCartButton`·`WishlistButton`) |
| `widgets/commerce` | `CommerceHeader`(`ui/CommerceHeader.tsx`) | 개수 파생 `CommerceHeaderCounts`(`ui`, 내부) |
| `features/add-to-cart` | `AddToCartButton`(`ui/AddToCartButton.tsx`) | `useCartStore` 갱신 방식 |
| `features/toggle-wishlist` | `WishlistButton`(`ui/WishlistButton.tsx`) | `useWishlistStore` 갱신 방식 |
| `features/search` | `SearchInput`(`ui/SearchInput.tsx`) | debounce·URL 반영 방식 |
| `features/category-select` | `CategorySelect`·prefetch 카테고리 링크(`ui/`) | `productQueries` prefetch·URL 반영 방식 |
| `features/sort-select` | `SortSelect`(`ui/SortSelect.tsx`) | URL 반영 방식 |
| `_pages/home` | 홈 진입 컴포넌트(`ui/HomeContent.tsx`) | `api/home.ts`(`homeQueries`)·서버 prefetch 배선 |
| `_pages/products` | 상품 목록 진입 컴포넌트(`ui/ProductListSection.tsx`) | `ui` 하위 컴포넌트, `model`(nuqs 파서 `productListParsers`·URL 훅 `useProductListSearchParams`) — 조회 조건 정의·정규화 로직은 `entities/product` 소유 |
| `shared/ui` | `dialog`·`select`·`pagination` 컴포넌트·헤드리스 훅(세그먼트 `index`) | 내부 상태/DOM 처리 |
| `shared/api` | `requestJson`·`getBaseUrl`(http 클라이언트) | — |
| `shared/lib` | `useDebouncedValue`·`formatPrice` | — |

**`ProductCard` 와 장바구니·위시리스트 행위의 조합 방법**

`ProductCard` 는 `widgets/product-card` 라 features 를 직접 import 한다(위→아래). 상품 데이터(`Product`)는 props 로 받아 표시만 하고, 담기·찜 버튼은 내부에서 `features/add-to-cart`·`features/toggle-wishlist` 의 버튼을 `productId` 만 넘겨 렌더한다.

**Public API 사용 여부와 방식**

모든 slice 는 `index.ts` 로만 공개하고 내부 파일 직접 import 를 금지한다. `shared` 는 slice 가 없어 세그먼트별 public API(`shared/ui`·`shared/api`·`shared/lib`)로 공개한다. cross-slice 는 public API 경유, 같은 slice 안 segment 끼리는 상대경로. `index.ts` 에는 밖에서 실제로 쓰는 것만 노출. 안 쓰는 내부 심볼은 export 하지 않아 노출을 최소로 유지. 기준 없이 그냥 전부 공개해버리면 단순한 barrel file에 불과함.

### O — Optimization

**TanStack Query 캐시 정책 유지/변경 근거**

기능을 유지하되 FSD로 구조를 바꾸는게 목적이므로 5주차 캐시 정책을 그대로 유지.

**로딩·에러 경계 범위**

- **로딩**: 홈과 목록의 방식이 다르다. 전환 후 Suspense fallback 은 라우팅 진입점(`app/**/page.tsx`)에, 목록의 컴포넌트 `isPending` 로딩은 `_pages/products` UI 에 남는다.
  - **홈** — `HomeContent` 가 `useSuspenseQuery` 라, 로딩은 진입점의 **Suspense** fallback(`app/page.tsx` 의 "홈 데이터를 불러오는 중…")이 담당한다.
  - **상품 목록** — 서버 prefetch(`ProductListSection`)를 **Suspense** 로 감싸, 첫 진입엔 그 fallback(`app/products/page.tsx` 의 "상품 목록을 불러오는 중…")을 보여준다. 클라이언트 `ProductList` 는 `useSuspenseQuery` 가 아니라 `useQuery` 라, `isPending` 으로 **첫 로드에만** 로딩을 띄운다 — `keepPreviousData` 라 페이지 전환 중엔 `isPending=false` 로 기존 목록을 유지한다.
- **에러**: Next 라우트 경계(`app/error.tsx`·`app/products/error.tsx`)에서 잡는다. 현재는 홈의 경우는 헤더까지 덮는 페이지 경계이므로 개선이 필요. [참고](#r--requirements)

**이번 주에 하지 않을 최적화와 이유**

- **에러 경계를 헤더 안 덮게 좁히기(부분 경계)** — 기존 버그로, [R표](#r--requirements)에서 후순위로 미룬 항목. 
- **상품 목록 로딩 경계 방식 통일** — 지금은 상품 목록은 `useQuery`+`isPending` / 서버 Suspense와 컴포넌트 `isPending` 두 곳으로 흩어져 있어 개선이 필요. 에러 경계와 마찬가지로 이번 과제인 구조 변경에 먼저 집중하기 위해 후 순위로 미룸
