# Week 06 FSD RFC

## 목적

5주차까지 만든 커머스 동작을 유지하면서 폴더 구조를 FSD 관점으로 재설계한다.
이번 리팩토링의 기준은 "파일 종류별 분리"가 아니라 "비즈니스 역할별 응집"과
"변경이 어디까지 퍼지는지 예측할 수 있는 구조"다.

코드를 옮긴다는 이유로 5주차에서 정한 Source of Truth는 바꾸지 않는다.

- 서버 응답은 TanStack Query가 소유한다.
- 검색, 카테고리, 정렬, 페이지는 URL이 소유한다.
- 비로그인 장바구니와 위시리스트는 Zustand가 소유한다.
- 입력 중 draft와 일시적인 열림 상태는 React local state가 소유한다.

## R — Requirements

### 보존할 동작

- 홈에서 배너, 카테고리, 인기 상품, 신상품을 표시한다.
- 상품 목록에서 검색, 카테고리, 정렬, 페이지네이션이 동작한다.
- 검색, 카테고리, 정렬, 페이지는 URL에 반영되고 새로고침, 공유 URL, 뒤로/앞으로 가기에서 복원된다.
- 홈과 상품 목록에서 장바구니/위시리스트 상태가 동기화된다.
- 페이지 이동 중 Zustand 상태와 헤더 개수가 유지된다.
- 홈과 상품 목록의 로딩, 에러, 빈 상태를 구분한다.
- 서버 prefetch, 다음 페이지 prefetch, 검색 debounce, 기존 목록 유지 동작을 보존한다.
- 잘못된 `scenario`는 사용자 URL 상태나 `ProductListQuery`에 포함하지 않는다.

### 이번 주에 하지 않을 것

- 새로운 커머스 기능을 추가하지 않는다.
  - 이번 과제의 목적은 기능 추가가 아니라 구조 변경 반경을 설계하는 것이다.
- FSD의 모든 레이어를 억지로 만들지 않는다.
  - 현재 코드에서 역할이 필요한 레이어와 세그먼트만 만든다.
- 서버 응답을 Zustand에 복사하지 않는다.
  - 폴더 이동 때문에 5주차 Source of Truth를 바꾸지 않는다.
- `src/app/api` mock API와 fixture는 우선 전환 범위에서 제외한다.
  - 프론트엔드 FSD 전환이 목적이고, mock 백엔드는 라우트 핸들러 계약을 유지하는 쪽이 안전하다.

### 동작 기준선 검증

폴더를 옮기기 전에 아래 기준선을 먼저 확인한다.

| 시작 URL                                                | 행동                                  | 기대값                                 | 실제 결과 |
| ------------------------------------------------------- | ------------------------------------- | -------------------------------------- | --------- |
| `/`                                                     | 홈 진입                               | 배너, 카테고리, 인기 상품, 신상품 표시 | 확인 예정 |
| `/products?q=스탠리&category=goods&sort=popular&page=2` | 새로고침                              | 검색어/카테고리/정렬/페이지 유지       | 확인 예정 |
| `/products?q=스탠리&category=goods&sort=popular&page=2` | URL 복사 후 새 탭에서 열기            | 같은 조건의 상품 목록 렌더링           | 확인 예정 |
| `/products`                                             | 검색, 카테고리, 정렬 변경 후 뒤로가기 | 이전 URL 조건과 목록 복원              | 확인 예정 |
| `/products`                                             | 뒤로가기 후 앞으로가기                | 다음 URL 조건과 목록 복원              | 확인 예정 |
| `/`                                                     | 홈 카테고리에서 상품 목록으로 이동    | 해당 카테고리 조건으로 목록 조회       | 확인 예정 |
| `/`                                                     | 홈에서 찜/담기 후 `/products` 이동    | 헤더 count와 같은 상품 버튼 상태 유지  | 확인 예정 |
| `/products?page=99`                                     | 직접 진입                             | 응답 후 마지막 페이지로 replace        | 확인 예정 |

## A — Architecture

### 현재 구조에서 겪는 문제

1. `src/components/commerce`에 상품 UI, 장바구니/위시리스트 연결, 헤더가 함께 있다.
   - 상품 표현과 사용자 행위 연결 지점이 같은 폴더에 있어 변경 반경을 예측하기 어렵다.

2. `src/features/products`에 상품 목록 페이지 조합, 필터 UI, URL 상태, queryOptions, API 호출이 함께 있다.
   - 상품 목록 기능이 응집되어 보이지만 FSD 관점에서는 page 조합, feature 행위, entity API가 섞여 있다.

3. `src/stores/commerce`가 cart와 wishlist를 함께 담고 있다.
   - 위시리스트만 제거하는 시나리오에서 어떤 파일을 삭제해야 하는지 store 내부를 읽어야 한다.

4. `src/types/commerce.ts`에 Product와 Category 타입이 함께 있다.
   - 타입의 소유자가 product인지 category인지 흐릿해질 수 있다.

5. `src/app/(commerce)/page.tsx`와 `src/app/(commerce)/products/page.tsx`가 prefetch와 page 조합을 직접 알고 있다.
   - Next.js 라우팅 entry가 FSD page 조합 역할까지 일부 맡고 있다.

6. `src/hooks`, `src/lib`, `src/constants`는 기술 종류 기준 폴더다.
   - 재사용 범위가 명확한 것은 shared로, 특정 도메인에 속하는 것은 해당 slice로 이동해야 한다.

### 현재 구조 요약

```txt
src/app
src/components/commerce
src/components/ui
src/constants
src/features/home
src/features/products
src/hooks
src/lib
src/stores/commerce
src/types
```

### 목표 구조 초안

```txt
src/app                         # Next.js 라우팅 entry
src/_app                        # provider, app-level 설정
src/_pages/home                 # 홈 전용 UI, query 조합
src/_pages/products             # 상품 목록 전용 UI, URL 상태, 필터, 페이지네이션

src/widgets/header              # 헤더 조합
src/widgets/product-card        # 상품 카드와 사용자 행위 조합

src/features/add-to-cart        # 장바구니 담기/빼기 행위
src/features/toggle-wishlist    # 위시리스트 토글 행위

src/entities/product            # 상품 타입, 상품 API/query, 상품 표시 UI
src/entities/cart               # 장바구니 상태/model
src/entities/wishlist           # 위시리스트 상태/model
src/entities/category           # 카테고리 타입/상수, product 전용 @x 공개 API

src/shared                      # 비즈니스에 종속되지 않는 UI/lib/api/config
```

### pages first 적용 기준

FSD v2.1의 pages first 관점을 적용해 한 페이지에서만 쓰는 UI, 폼, URL 상태는 우선 page slice에 둔다.
처음부터 feature/entity로 잘게 나누지 않고, 실제로 여러 page에서 공유될 때 분리한다.

이번 전환에서는 상품 목록 필터, 페이지네이션, 상품 목록 URL 상태를 `_pages/products`에 둔다.
이 값들은 현재 `/products` 한 page에서만 사용되므로 `features/filter-products`로 분리하지 않는다.

반면 장바구니 담기와 위시리스트 토글은 홈과 상품 목록 두 page에서 모두 사용되는 사용자 행위다.
따라서 상태 자체는 `entities/cart`, `entities/wishlist`가 소유하고,
버튼 행위는 `features/add-to-cart`, `features/toggle-wishlist`로 분리한다.
상품 카드에서 product UI와 두 feature를 함께 보여주는 조합은 `widgets/product-card`에서 담당한다.

카테고리는 상품 목록 필터 UI에만 쓰이는 값이 아니라 홈 카테고리 탐색, 상품 목록 URL 조건,
API query param, `Product.category` 필드에 모두 걸쳐 있는 도메인 식별자다.
따라서 `_pages/products`나 `features/filter-products`가 아니라 `entities/category`가 `CategoryId`,
`Category`, 카테고리 상수를 소유한다.

다만 `Product.category`는 `CategoryId`를 참조하므로 product entity와 category entity 사이에
cross-import 후보가 생긴다.
이 관계를 일반 Public API import로 숨기지 않고 `entities/category/@x/product`를 통해
product entity에 필요한 타입만 공개한다.
`@x`는 entity 간 관계를 명시하기 위한 예외 통로이므로 `CategoryId` 같은 타입 공개로 제한하고,
category 내부 parser나 화면별 정책은 노출하지 않는다.

### 사용할 레이어와 사용하지 않을 레이어

| 레이어       | 사용 여부       | 이유                                                                                                                                         |
| ------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`    | 사용            | Next.js 라우팅 디렉터리로 유지한다. FSD app 레이어와 역할이 다르므로 라우팅 entry만 둔다.                                                    |
| `src/_app`   | 사용            | Provider, QueryClient 설정처럼 앱 전체 조립 책임을 둔다.                                                                                     |
| `src/_pages` | 사용            | App Router page를 얇게 만들고 홈/상품 목록 page 조합을 옮긴다.                                                                               |
| `widgets`    | 사용            | 헤더, 상품 카드와 행위 조합처럼 여러 feature/entity를 조합하는 UI를 둔다.                                                                    |
| `features`   | 제한적으로 사용 | 홈과 상품 목록에서 실제로 공유되는 장바구니 담기, 위시리스트 토글 행위에만 둔다. 상품 목록 필터처럼 한 page 전용인 행위는 page slice에 둔다. |
| `entities`   | 사용            | product, cart, wishlist, category처럼 도메인 상태와 타입의 소유자를 둔다.                                                                    |
| `shared`     | 사용            | 비즈니스 의미가 없는 UI primitive, API helper, 공통 설정만 둔다.                                                                             |
| `processes`  | 미사용          | 현재는 여러 페이지를 관통하는 장기 프로세스가 없다.                                                                                          |

`_app`과 `shared`는 비즈니스 slice로 나누지 않고 segment를 바로 둔다.
FSD 공식 문서에서도 App layer는 routing, entrypoint, global styles, providers를 맡고,
Shared와 App은 layer이면서 동시에 slice처럼 동작하는 예외로 설명한다.
따라서 `_app`에는 `providers`, `config`, `model`처럼 앱 실행 목적이 분명한 segment를 바로 둔다.
`providers`는 표준 5개 segment 이름은 아니지만 앱 전체 Provider 조합이라는 목적이 명확한 app layer 전용 custom segment로 사용한다.

### import 방향 규칙

허용:

```ts
// page는 widget, feature, entity, shared를 조합할 수 있다.
import { ProductListPage } from "@/_pages/products";

// widget은 feature와 entity를 조합할 수 있다.
import { AddToCartButton } from "@/features/add-to-cart";
import { ProductCard } from "@/entities/product";

// feature는 entity와 shared를 사용할 수 있다.
import { useCartStore } from "@/entities/cart";
```

금지:

```ts
// entity가 feature를 알면 역방향 의존이다.
import { ToggleWishlistButton } from "@/features/toggle-wishlist";

// feature끼리 직접 import하지 않는다. 상위 레이어에서 조합한다.
import { AddToCartButton } from "@/features/add-to-cart";

// shared에 상품 정책이 들어가면 비즈니스 로직이 새는 것이다.
import { getProductBadges } from "@/shared/lib";
```

예외:

```ts
// product entity가 Product.category 타입을 표현하기 위해 category entity의 product 전용 공개 API를 참조한다.
import type { CategoryId } from "@/entities/category/@x/product";
```

이 예외는 `Product.category`와 `CategoryId` 사이의 도메인 관계를 코드 구조에 드러내기 위한 것이다.
같은 entity layer 간 일반 import를 넓게 허용하지 않고, product 전용 `@x` entry만 열어 변경 영향을 좁힌다.

### 마이그레이션 계획

| 단계 | 작업                                                    | 검증                                    | 되돌림 기준                                                                                 |
| ---- | ------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | RFC 작성 및 기준선 검증 기록                            | `pnpm check`, 브라우저 수동 검증        | 기준선이 불명확하면 코드 이동을 시작하지 않는다.                                            |
| 2    | `shared`와 `_app` 정리                                  | provider, api helper import 정상 확인   | 앱 부팅, QueryClient, NuqsAdapter, persist hydration 중 하나라도 깨지면 이 단계만 되돌린다. |
| 3    | `entities/product`, `entities/category` 이동            | 홈/목록 상품 렌더링, query test         | 상품 타입, query key, 카드 렌더링이 깨지면 entity 이동을 되돌린다.                          |
| 4    | `entities/cart`, `entities/wishlist` 이동               | store, persist, hydration test          | 새로고침 후 count 복원, 잘못된 저장값 복구, 버튼 상태가 깨지면 store 이동을 되돌린다.       |
| 5    | `features/add-to-cart`, `features/toggle-wishlist` 구성 | 홈/목록 버튼 상태 동기화 test           | feature가 서로 import하거나 entity가 feature를 import하면 구조를 다시 잡는다.               |
| 6    | `widgets/header`, `widgets/product-card` 조합           | 헤더 count, 상품 카드 action test       | 상품 UI와 사용자 행위 조합이 여러 page로 흩어지면 widget 경계를 다시 본다.                  |
| 7    | `_pages/home`, `_pages/products` 구성                   | URL, prefetch, loading/error/empty test | URL 복원, page 보정, prefetch, retry 중 하나라도 깨지면 page 이동을 되돌린다.               |
| 8    | app route entry 얇게 정리                               | build, route error/loading 동작 확인    | route entry가 다시 비즈니스 로직을 갖거나 error/loading 경계가 깨지면 분리를 재검토한다.    |

구조 변경 중 기존 버그를 발견하면 구조 이동 커밋과 분리해 재현 방법, 원인, 수정 위치, 검증 결과를 따로 기록한다.

## D — Data Model

| 상태                        | Source of Truth             | 소유 슬라이스/레이어                                   | 소비하는 곳                        | 이동 후에도 중복 저장하지 않는 방법                                                                               |
| --------------------------- | --------------------------- | ------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 홈 배너, 인기 상품, 신상품  | 서버/TanStack Query         | `_pages/home` query 조합, `entities/product` 상품 타입 | 홈                                 | 서버 응답을 Zustand에 복사하지 않고 Query 캐시만 사용한다.                                                        |
| 상품 조회 결과              | 서버/TanStack Query         | `entities/product/api`                                 | 홈, 상품 목록                      | 상품 객체는 Query 응답으로만 소비하고 cart/wishlist에는 ID만 저장한다.                                            |
| 카테고리 목록/카테고리 타입 | 서버 응답 + category entity | `entities/category`                                    | 홈, 상품 목록 필터, product entity | 카테고리 타입과 상수는 category entity가 소유하고, product entity에는 `@x/product`로 `CategoryId`만 공개한다.     |
| 검색, 정렬, 페이지          | URL/nuqs                    | `_pages/products/model`                                | 상품 목록                          | URL parser 결과를 query key와 API 요청에 사용하고 별도 전역 상태로 복사하지 않는다.                               |
| 검색 input draft            | React 로컬 상태             | `_pages/products/ui`                                   | 상품 필터                          | debounce 전 입력값만 로컬 state로 두고 확정 조건은 URL에 둔다. 현재 한 page 전용이므로 feature로 승격하지 않는다. |
| 장바구니                    | Zustand persist             | `entities/cart/model`                                  | 헤더, 상품 행위 UI                 | 상품 ID map만 저장하고 상품 응답을 복사하지 않는다.                                                               |
| 위시리스트                  | Zustand persist             | `entities/wishlist/model`                              | 헤더, 상품 행위 UI                 | 상품 ID map만 저장하고 상품 응답을 복사하지 않는다.                                                               |
| 헤더 개수                   | 파생값                      | `widgets/header`에서 selector로 소비                   | 헤더                               | cart/wishlist map key 개수로 계산한다.                                                                            |
| Dialog 열림 여부            | React 로컬 상태             | 해당 UI                                                | Dialog 예시/사용처                 | 전역 상태로 올리지 않는다.                                                                                        |

### Zustand store 조합 결정

cart와 wishlist의 상태와 action 정의는 각각 `entities/cart/model`, `entities/wishlist/model`로 분리한다.
장바구니와 위시리스트는 여러 page와 widget에서 소비되는 도메인 상태이므로 feature 버튼이 아니라 entity가 소유한다.

다만 `persist`, `skipHydration`, `rehydrate`, storage migration처럼 저장소 생명주기를 다루는 설정은
`src/_app/model/commerceStore.ts`의 root store에서 한 번만 관리한다.
Zustand 공식 Slices Pattern도 개별 slice를 조합해 하나의 bounded store를 만들고,
`persist` 같은 middleware는 combined store에 적용하는 방식을 안내한다.

이 결정의 trade-off는 다음과 같다.

- cart/wishlist slice를 분리하므로 도메인별 상태와 action의 소유자는 명확해진다.
- root store 조합부는 `_app`에 남으므로 persist/hydration 설정을 중복하지 않는다.
- 위시리스트 기능 제거 시 wishlist entity와 feature를 삭제한 뒤 root store 조합부 수정은 필요하다.
- `_app → entities` import 방향이므로 FSD 의존 방향을 지킨다.
- entity가 root store를 import하지 않도록 해 entity가 app layer를 알지 않게 한다.

## I — Interface

### 슬라이스 공개 API 초안

| 슬라이스                   | 공개할 값                                                             | 숨길 구현 세부                                           |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `entities/product`         | `Product`, `ProductCard`, `productQueries`                            | price formatting, ProductCard adapter 세부               |
| `entities/category`        | `Category`, `CategoryId`, `CATEGORY_IDS`, `@x/product`의 `CategoryId` | parser 구현 세부, 화면별 필터 옵션                       |
| `entities/cart`            | cart selector/action hook                                             | Zustand store shape, persist storage key, migration 세부 |
| `entities/wishlist`        | wishlist selector/action hook                                         | Zustand store shape, persist storage key, migration 세부 |
| `features/add-to-cart`     | `AddToCartButton` 또는 `useAddToCart`                                 | Zustand map 구조, cart entity 연결 세부                  |
| `features/toggle-wishlist` | `ToggleWishlistButton` 또는 `useToggleWishlist`                       | Zustand map 구조, wishlist entity 연결 세부              |
| `widgets/product-card`     | `CommerceProductCard`                                                 | product UI와 cart/wishlist feature 조합 세부             |
| `widgets/header`           | `CommerceHeader`                                                      | cart/wishlist count 구독 및 표시 조합                    |
| `_pages/products`          | `ProductListPage`, loading/error UI                                   | 내부 query/result/filter/url 조합                        |
| `_pages/home`              | `HomePage`, loading/error UI                                          | 내부 query/section 조합                                  |

### ProductCard와 장바구니/위시리스트 행위 조합

`entities/product/ui/ProductCard`가 `features/add-to-cart`나 `features/toggle-wishlist`를 직접 import하지 않는다.
상품 표현은 entity가 맡고, 찜/담기 같은 사용자 행위는 feature가 맡는다.
둘을 함께 보여주는 조합은 `widgets/product-card`에서 한다.

초안 결정은 `widgets/product-card`의 wrapper 방식이다.

```tsx
<CommerceProductCard product={product} />
```

현재 홈과 상품 목록에서 상품 카드 action 구성은 동일하다.
따라서 각 page에서 매번 cart/wishlist props를 계산하거나 action slot을 주입하기보다,
`CommerceProductCard`가 product UI와 cart/wishlist action을 조합한다.
이 방식은 현재 코드의 변경량이 작고, `ProductCard`를 상품 표시 UI로 유지하면서 store 연결을 widget 내부로 숨길 수 있다.

wrapper 내부 조합은 다음 형태를 목표로 한다.

```tsx
function CommerceProductCard({ product }: CommerceProductCardProps) {
  const cartAction = useAddToCart(product.id);
  const wishlistAction = useToggleWishlist(product.id);

  return (
    <ProductCard
      product={product}
      isInCart={cartAction.isPressed}
      isInWishlist={wishlistAction.isPressed}
      isActionDisabled={cartAction.disabled || wishlistAction.disabled}
      onCartToggle={cartAction.onClick}
      onWishlistToggle={wishlistAction.onClick}
    />
  );
}
```

다만 `CommerceProductCard`가 root store 내부 shape에 직접 의존하지는 않는다.
`cartProductIdMap` 같은 저장 구조를 직접 읽지 않고, `features/add-to-cart`, `features/toggle-wishlist`
또는 cart/wishlist entity의 공개 API를 통해 필요한 상태와 action만 소비한다.
`ProductCard`는 찜/담기 버튼의 위치, 접근성 속성, disabled 표현을 계속 담당하되,
상태 계산과 action 연결은 `CommerceProductCard`가 하위 slice의 공개 API로 조합한다.
`hasHydrated` 같은 persist 복원 상태도 `CommerceProductCard`에 직접 노출하지 않는다.
`useAddToCart`, `useToggleWishlist`가 각각 복원 상태를 읽고 `disabled`, `isPressed`로 변환해 반환한다.
두 feature hook에서 같은 hydration flag를 읽는 중복은 허용한다.
중요한 기준은 widget이 root store의 내부 shape나 persist 생명주기를 직접 알지 않게 하는 것이다.

나중에 화면마다 상품 카드 action 구성이 달라지면 `ProductCard`에 위치별 slot을 여는 방식으로 전환한다.

```tsx
<ProductCard
  product={product}
  imageOverlay={<ToggleWishlistButton productId={product.id} />}
  footerAction={<AddToCartButton productId={product.id} />}
/>
```

### Public API 사용 여부

Public API는 사용할 예정이다.
다만 경로를 줄이기 위한 습관적 barrel file은 만들지 않는다.

원칙:

- slice 외부에서 알아도 되는 값만 `index.ts`로 공개한다.
- `export *`는 사용하지 않는다.
- 같은 slice 내부 파일은 상대 경로 import를 허용한다.
- 공개 API가 없는 slice에는 index.ts를 만들지 않는다.

## O — Optimization

### TanStack Query 캐시 정책

5주차 정책을 유지한다.

| query     | staleTime | 유지/변경 | 이유                                                              |
| --------- | --------- | --------- | ----------------------------------------------------------------- |
| 홈        | 5분       | 유지      | 홈 배너/섹션은 같은 방문 안에서 자주 다시 볼 수 있다.             |
| 상품 목록 | 1분       | 유지      | 검색/정렬/페이지 조건이 자주 바뀌고 최신성이 홈보다 중요하다.     |
| gcTime    | 기본값    | 유지      | 이번 과제 핵심은 FSD 구조이며, 캐시 보관 시간 세밀화 요구가 없다. |

### prefetch 범위

- 서버에서는 홈 데이터와 `/products`의 현재 URL 조건만 prefetch한다.
- 상품 목록 전체 페이지나 모든 카테고리는 prefetch하지 않는다.
- 클라이언트에서는 상품 목록 응답 이후 `hasNextPage`가 있으면 다음 페이지 1개만 prefetch한다.

상품 목록은 첫 화면 핵심 데이터라 서버 prefetch 대상이다.
다음 페이지는 페이지네이션에서 이동 가능성이 높고 mock API에 500ms 지연이 있어 자동 prefetch 대상이다.
하지만 모든 페이지를 미리 가져오면 요청 범위가 과하므로 `page + 1` 하나로 제한한다.

### 이번 주에 하지 않을 최적화

- 상품 상세 페이지 prefetch는 하지 않는다.
  - 현재 상품 상세 페이지가 없고 클릭 목적지가 명확하지 않다.
- 모든 카테고리/정렬 조합 prefetch는 하지 않는다.
  - 사용자가 보지 않을 가능성이 높은 데이터를 미리 가져오는 비용이 크다.
- persist 상태를 서버 계정 상태와 병합하지 않는다.
  - 로그인 기능이 없는 과제 범위다.

## 파일 매핑표

| 현재 위치                                             | 목표 위치                                                                     | 레이어 / 슬라이스 / 세그먼트 | 이동 또는 유지 이유                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/app/providers.tsx`                               | `src/_app/providers/Providers.tsx`                                            | `_app/providers`             | 앱 전체 Provider 조합이다.                                                                                        |
| `src/app/get-query-client.ts`                         | `src/_app/config/getQueryClient.ts`                                           | `_app/config`                | QueryClient 생성 정책은 앱 설정이다.                                                                              |
| `src/components/ui/Skeleton.tsx`                      | `src/shared/ui/Skeleton.tsx`                                                  | `shared/ui`                  | 비즈니스 의미가 없는 UI primitive다.                                                                              |
| `src/components/ui/select/useSelect.ts`               | `src/shared/ui/select/useSelect.ts`                                           | `shared/ui`                  | 특정 도메인에 묶이지 않는 headless UI hook이다.                                                                   |
| `src/components/ui/dialog/*`                          | `src/shared/ui/dialog/*`                                                      | `shared/ui`                  | 특정 도메인에 묶이지 않는 compound UI다.                                                                          |
| `src/lib/apiUtils.ts`                                 | `src/shared/api/apiUtils.ts`                                                  | `shared/api`                 | HTTP 응답 처리 helper이며 화면 문구를 소유하지 않는다.                                                            |
| `src/constants/commerce.ts`                           | `src/entities/category/model/constants.ts`                                    | `entities/category/model`    | 카테고리 ID와 상품 정렬 값의 소유자를 분리한다.                                                                   |
| `src/types/commerce.ts`                               | `src/entities/product/model/types.ts`, `src/entities/category/model/types.ts` | `entities/*/model`           | 통짜 타입 파일을 도메인 소유자 기준으로 분해한다.                                                                 |
| `Product.category`의 `CategoryId` 참조                | `src/entities/category/@x/product.ts`                                         | `entities/category/@x`       | product entity가 참조해도 되는 category 타입만 좁게 공개한다.                                                     |
| `src/components/commerce/ProductCard.tsx`             | `src/entities/product/ui/ProductCard.tsx`                                     | `entities/product/ui`        | 상품 표시 UI는 product entity의 표현이다.                                                                         |
| `src/components/commerce/productCardAdapter.ts`       | `src/entities/product/ui/productCardAdapter.ts`                               | `entities/product/ui`        | Product를 ProductCard 표시 props로 변환하는 UI adapter다. API DTO mapper가 아니므로 ProductCard 표현 근처에 둔다. |
| `src/components/commerce/ProductGrid.tsx`             | `src/widgets/product-grid/ui/ProductGrid.tsx`                                 | `widgets/product-grid/ui`    | 상품 카드 목록을 화면 단위로 배치한다.                                                                            |
| `src/components/commerce/ProductGridSkeleton.tsx`     | `src/widgets/product-grid/ui/ProductGridSkeleton.tsx`                         | `widgets/product-grid/ui`    | 상품 grid의 loading layout이다.                                                                                   |
| `src/components/commerce/ProductSection.tsx`          | `src/widgets/product-section/ui/ProductSection.tsx`                           | `widgets/product-section/ui` | 홈의 상품 섹션 조합 UI다.                                                                                         |
| `src/components/commerce/CommerceHeader.tsx`          | `src/widgets/header/ui/CommerceHeader.tsx`                                    | `widgets/header/ui`          | cart/wishlist count를 조합하는 상단 UI다.                                                                         |
| `src/components/commerce/CommerceProductCard.tsx`     | `src/widgets/product-card/ui/CommerceProductCard.tsx`                         | `widgets/product-card/ui`    | product UI와 cart/wishlist feature를 조합한다.                                                                    |
| `src/stores/commerce/cartSlice.ts`                    | `src/entities/cart/model/cartSlice.ts`                                        | `entities/cart/model`        | 장바구니 상태와 action의 소유자는 cart entity다.                                                                  |
| `src/stores/commerce/wishlistSlice.ts`                | `src/entities/wishlist/model/wishlistSlice.ts`                                | `entities/wishlist/model`    | 위시리스트 상태와 action의 소유자는 wishlist entity다.                                                            |
| `src/stores/commerce/persistence.ts`                  | `src/_app/model/commercePersistence.ts`                                       | `_app/model`                 | cart/wishlist가 공유하는 persist, version, migration 정책이므로 root store 생명주기와 함께 둔다.                  |
| `src/stores/commerce/store.ts`                        | `src/_app/model/commerceStore.ts`                                             | `_app/model`                 | cart/wishlist slice를 조합하고 persist/hydration middleware를 한 번만 적용하는 root store다.                      |
| `src/features/home/*`                                 | `src/_pages/home/*`                                                           | `_pages/home`                | 현재 홈 전용 page 조합이다.                                                                                       |
| `src/features/home/api/homeApi.ts`                    | `src/_pages/home/api/homeApi.ts`                                              | `_pages/home/api`            | `/api/home`은 홈 화면용 aggregate 응답이다.                                                                       |
| `src/features/home/queries/homeQueries.ts`            | `src/_pages/home/api/homeQueries.ts`                                          | `_pages/home/api`            | 홈 page 전용 query factory다.                                                                                     |
| `src/features/products/ProductListPageClient.tsx`     | `src/_pages/products/ui/ProductListPage.tsx`                                  | `_pages/products/ui`         | 상품 목록 page 조합 컴포넌트다.                                                                                   |
| `src/features/products/ProductFilters.tsx`            | `src/_pages/products/ui/ProductFilters.tsx`                                   | `_pages/products/ui`         | 현재 상품 목록 페이지 전용 필터 UI다.                                                                             |
| `src/features/products/useProductListSearchParams.ts` | `src/_pages/products/model/useProductListSearchParams.ts`                     | `_pages/products/model`      | 상품 목록 URL 상태는 page 전용이다.                                                                               |
| `src/features/products/searchParams.ts`               | `src/_pages/products/model/searchParams.ts`                                   | `_pages/products/model`      | 상품 목록 URL parser다.                                                                                           |
| `src/features/products/queries/productQueries.ts`     | `src/entities/product/api/productQueries.ts`                                  | `entities/product/api`       | 상품 조회 query factory다.                                                                                        |
| `src/features/products/api/productApi.ts`             | `src/entities/product/api/productApi.ts`                                      | `entities/product/api`       | 상품 목록 API 계약은 product entity가 소유한다.                                                                   |

`entities/product/api`는 상품 API 요청/응답 계약과 query factory만 소유한다.
`ProductListQuery`는 서버가 받는 API 계약으로 정의하되, `_pages/products`의 URL parser 타입이나
`PRODUCT_CATEGORY_FILTERS`를 import하지 않는다.
`category=all`은 API가 지원하는 조회 조건으로만 표현하고,
`PRODUCT_CATEGORY_FILTERS`, `PRODUCT_LIST_PAGE_SIZE`, page 보정, debounce 같은 화면 탐색 정책은
`_pages/products/model`에 남긴다.

## 애매한 파일 결정표

| 대상                                | 후보 A                                                  | 후보 B                                       | 최종 결정                           | 기준                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProductCard`                       | `entities/product/ui`                                   | `widgets/product-card/ui`                    | `entities/product/ui`               | widgets에 두면 찜/담기 조합까지 한 번에 다루기 쉽지만 상품 표시 UI까지 상위 조합 레이어에 묶인다. 상품 정보 표시와 카드 내부 버튼 위치/접근성 표현은 product entity의 UI로 두고, 버튼 상태 계산과 cart/wishlist action 연결은 직접 import하지 않는다.                               |
| `CommerceProductCard`               | `features`                                              | `widgets/product-card/ui`                    | `widgets/product-card/ui`           | feature에 두면 특정 사용자 행위처럼 보이지만 실제로는 상품 표시, 장바구니, 위시리스트를 함께 배치하는 조합 UI다. `useAddToCart`, `useToggleWishlist` 공개 API를 통해 상태와 action을 소비하고 root store shape는 숨기므로 widget이 맞다.                                            |
| 상품 목록 queryOptions              | `entities/product/api`                                  | `_pages/products/api`                        | `entities/product/api`              | `_pages/products`에 두면 현재 화면과 가깝지만 홈/목록이 같은 상품 조회 계약을 공유하기 어렵다. 상품 조회 query key와 API 요청/응답 계약은 product entity에 둔다. 다만 URL parser, `PRODUCT_CATEGORY_FILTERS`, page 보정, debounce 같은 화면 탐색 정책은 `_pages/products`에 남긴다. |
| 홈 queryOptions                     | `entities/product/api`                                  | `_pages/home/api`                            | `_pages/home/api`                   | product entity에 두면 인기 상품/신상품 배열을 상품 조회의 한 종류처럼 다룰 수 있지만, `/api/home`은 배너, 카테고리, 인기 상품, 신상품을 묶은 홈 aggregate 응답이다. 홈 page 전용 API로 둔다.                                                                                        |
| 장바구니 store                      | `entities/cart/model`                                   | `features/add-to-cart/model`                 | `entities/cart/model`               | feature에 두면 담기 버튼 구현과 가깝지만 장바구니 상태는 헤더와 여러 상품 카드가 공유하는 도메인 상태다. cart slice의 상태와 action은 `entities/cart/model`이 소유하고, cart/wishlist를 합치는 root store와 persist/hydration 설정은 `_app/model`에서 조합한다.                     |
| 위시리스트 store                    | `entities/wishlist/model`                               | `features/toggle-wishlist/model`             | `entities/wishlist/model`           | feature에 두면 토글 버튼과 가깝지만 위시리스트 상태는 여러 화면에서 공유된다. wishlist slice의 상태와 action은 `entities/wishlist/model`이 소유하고, cart/wishlist를 합치는 root store와 persist/hydration 설정은 `_app/model`에서 조합한다.                                        |
| root commerce store                 | `entities/cart`와 `entities/wishlist`에 각각 store 생성 | `_app/model/commerceStore.ts`에서 slice 조합 | `_app/model/commerceStore.ts`       | entity별 store로 완전히 쪼개면 소유권은 선명하지만 persist/hydration 설정이 중복된다. Zustand 공식 slice pattern처럼 cart/wishlist slice는 entity가 소유하고, middleware는 combined root store에 한 번만 적용한다.                                                                  |
| commerce persistence                | 각 entity의 `model/persistence.ts`                      | `_app/model/commercePersistence.ts`          | `_app/model/commercePersistence.ts` | entity별 persistence로 나누면 삭제 반경은 줄지만 storage version, migration, skipHydration 정책이 중복된다. 현재는 cart/wishlist를 같은 익명 로컬 저장소 생명주기로 복원하므로 root store persistence로 묶는다.                                                                     |
| `src/types/commerce.ts`의 `Product` | `entities/product/model`                                | `shared/types`                               | `entities/product/model`            | shared에 두면 import는 쉬워지지만 도메인 타입 창고가 되어 소유자가 흐려진다. Product는 소유자가 명확한 도메인 타입이므로 product entity가 소유한다.                                                                                                                                 |
| `Product.category`와 `CategoryId`   | `shared/api/commerce`에 contract 타입으로 분리          | `entities/category/@x/product`               | `entities/category/@x/product`      | `CategoryId`는 API query param이기도 하지만 category 도메인의 식별자다. shared로 빼면 category 소유권이 흐려지고, 일반 Public API import는 entity 간 cross-import 의도가 덜 드러난다. product 전용 `@x` Public API로 `CategoryId` 타입만 노출해 `Product.category` 관계를 명시한다. |
| `ProductFilters`                    | `features/filter-products/ui`                           | `_pages/products/ui`                         | `_pages/products/ui`                | feature로 분리하면 재사용 가능성은 열리지만 현재는 상품 목록 페이지 전용이고 URL parser/page 보정 정책과 함께 움직인다. 다른 상품 탐색 화면에서 재사용될 때 feature로 승격한다.                                                                                                     |
| `useDebouncedValue`                 | `shared/lib/debounce`                                   | `_pages/products/lib`                        | `shared/lib/debounce`               | page 내부에 두면 현재 사용처와 가깝지만 debounce 자체는 비즈니스 정책이 없는 일반 hook이다. 다만 `shared/lib` 루트에 쌓지 않고 목적이 드러나는 `debounce` 하위 경로에 둔다. URL 반영 시점과 delay 정책은 page가 소유한다.                                                           |
| `formatPrice`가 생기는 경우         | `shared/lib/format`                                     | `entities/product/lib`                       | 정책 포함 여부로 결정               | 단순 숫자 포맷은 `shared/lib/format`에 둘 수 있다. 상품 할인, 회원 등급, 배송 정책이 섞이면 product/pricing 도메인 규칙이므로 `entities/product/lib` 또는 별도 pricing entity로 승격한다.                                                                                           |

## 에러 처리 경계

| 실패 유형                          | 처리 위치                                                        | Error Boundary로 전파하는가 | 사용자 UI                                     | 재시도 방법                                  | 이 경계를 선택한 이유                                                                        |
| ---------------------------------- | ---------------------------------------------------------------- | --------------------------- | --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 홈 조회 실패                       | `_pages/home` error boundary                                     | 예                          | 홈 데이터를 불러오지 못했다는 fallback        | `QueryErrorResetBoundary` + boundary `reset` | 홈 aggregate 데이터가 없으면 홈 본문 전체를 렌더하기 어렵다.                                 |
| 상품 목록 조회 실패                | `_pages/products` 결과 영역                                      | 아니오                      | 목록 영역 안의 에러와 다시 시도 버튼          | query `refetch`                              | 필터와 헤더는 유지하고 결과 영역만 복구 가능하게 한다.                                       |
| 잘못된 검색 조건 4xx               | `_pages/products/model` URL parser, API 응답 방어 처리           | 아니오                      | 내부 기본값 조회 또는 결과 영역 인라인 메시지 | 조건 변경                                    | 사용자가 고칠 수 있는 입력 문제라 전체 라우트 경계로 올리지 않는다.                          |
| 예상하지 못한 렌더링 오류          | route segment `error.tsx`                                        | 예                          | 라우트 fallback                               | `reset`                                      | 코드 버그나 예측 못한 오류는 라우트 경계에서 복구한다.                                       |
| 장바구니/위시리스트 로컬 행위 오류 | `features/add-to-cart`, `features/toggle-wishlist` action 호출부 | 아니오                      | 현재 해당 없음                                | 향후 toast 또는 inline message               | 현재 로컬 map toggle은 실패 가능성이 낮다. 서버 동기화가 붙으면 mutation error로 재설계한다. |

Error Boundary는 이벤트 핸들러와 비동기 콜백 오류를 자동으로 잡지 못한다.
장바구니/위시리스트 클릭 중 발생하는 오류는 해당 action 또는 mutation 호출부에서 처리한다.

route `loading.tsx`/Suspense는 서버 prefetch 또는 page shell 로딩 범위를 맡고,
Query `isPending`은 클라이언트 refetch나 결과 영역 로딩 범위를 맡는다.
하나로 합치지 않는 이유는 라우트 진입 로딩과 목록 조건 변경 로딩의 사용자 영향 범위가 다르기 때문이다.

## 삭제 시나리오 자가 검증

### 위시리스트 기능을 통째로 제거한다면

예상 삭제 파일:

- `src/entities/wishlist/**`
- `src/features/toggle-wishlist/**`
- `src/widgets/product-card` 안의 wishlist action 조합
- `src/widgets/header` 안의 wishlist count 표시
- wishlist 관련 테스트

예상 수정 파일:

- `src/_app/model/commerceStore.ts`와 `src/_app/model/commercePersistence.ts`에서 wishlist slice 조합을 제거한다.
- `ProductCard`의 시각적 계약에 wishlist 버튼이 포함되어 있다면 해당 props와 버튼 UI를 제거한다.

판정:

- `ProductCard`가 wishlist feature나 root store를 직접 import하지 않으면 의존 방향은 지킨다.
- 다만 상품 카드의 시각적 계약에 wishlist 버튼이 포함되어 있으면 wishlist 제거 시 product UI 수정은 필요하다.
- widget에서 wishlist action 상태를 조합하고 feature 공개 API로 연결하면 삭제 반경을 더 예측하기 쉽다.

### 신상품 뱃지를 상품 카드에 추가한다면

예상 수정 파일:

- `src/entities/product/model/types.ts`
- `src/entities/product/ui/productCardAdapter.ts`
- `src/entities/product/ui/ProductCard.tsx`
- 상품 카드 테스트

판정:

- 상품 표시 정책이 product entity 안에서 끝나면 응집이 좋다.
- cart/wishlist feature나 page까지 수정해야 한다면 경계가 새고 있는 것이다.

## FSD 이해 확인

### ProductCard가 찜 버튼을 직접 import하면 어떤 의존 규칙을 어기는가?

`entities/product`가 `features/toggle-wishlist`를 import하면 하위 레이어가 상위 레이어를 아는 역방향 의존이다.
상품 표현과 사용자 행위가 함께 필요하면 `widgets/product-card` 또는 `_pages`에서 조합한다.

### 한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가?

반드시 feature일 필요는 없다.
현재 검색/카테고리/정렬/페이지 URL 상태는 상품 목록 페이지 전용이므로 `_pages/products/model`에 둔다.
다른 화면에서 같은 필터 행위를 재사용하게 되면 `features/filter-products`로 승격한다.

### formatPrice는 항상 shared/lib인가?

단순 숫자를 통화 문자열로 바꾸는 순수 포맷이면 `shared/lib/format`이 가능하다.
하지만 상품 할인, 회원 등급, 배송 정책이 들어가면 product나 pricing 도메인의 정책이므로 shared에 두지 않는다.

### 두 feature가 협력해야 할 때 어디에서 조합하는가?

feature끼리 직접 import하지 않고 `widgets` 또는 `_pages`에서 조합한다.
예를 들어 상품 카드에서 담기와 찜하기가 함께 필요하면 `widgets/product-card`가 두 feature를 가져와 배치한다.

### 폴더 이동 후에도 Query 데이터와 Zustand 데이터를 복사하지 않는 이유는 무엇인가?

서버 응답의 원본은 서버이고, TanStack Query는 그 스냅샷과 캐시 수명을 맡는다.
Zustand는 비로그인 사용자가 브라우저 안에서 만든 cart/wishlist ID map만 맡는다.
상품 객체를 Zustand에 복사하면 같은 데이터의 원본이 두 곳으로 갈라진다.

### barrel file과 Public API는 무엇이 다른가?

barrel file은 경로를 줄이려고 내부 파일을 습관적으로 재수출하는 파일이다.
Public API는 외부가 알아도 되는 값만 열고 내부 구현을 숨기는 계약이다.
이번 전환에서는 경계 통제를 위해 필요한 slice에만 `index.ts`를 만들고 `export *`는 사용하지 않는다.

## 검증 기록

코드 이동 전후 아래 명령을 실행한다.

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check
```

브라우저 수동 검증은 Requirements의 기준선 표에 시작 URL, 행동, 기대값, 실제 결과 형식으로 기록한다.

## AI 사용 및 직접 검토

FSD 레이어 후보, 애매한 파일 결정표, 에러 처리 경계, 삭제 시나리오 초안을 정리하는 과정에서 AI를 사용했다.
AI가 제안한 구조는 다음 기준으로 직접 검토한다.

- FSD 의존 방향을 지키는가
- 5주차 Source of Truth를 유지하는가
- 불필요한 레이어나 Public API를 만들지 않는가
- 삭제/변경 시나리오에서 변경 파일을 예측할 수 있는가
- 기존 홈/상품 목록 동작을 보존하는가
