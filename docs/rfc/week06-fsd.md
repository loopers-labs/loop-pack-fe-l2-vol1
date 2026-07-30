# RFC: Week 06 — 커머스 FSD 마이그레이션

- 브랜치: `feat/week-06`
- 상태: Phase 0 (파일 이동 전 커밋)
- 작성일: 2026-07-29

## 0. 동작 기준선

폴더를 옮기기 전에 아래 동작을 직접 확인했다. 마이그레이션 이후 모든 Phase에서 이 기준선이 그대로 유지되어야 한다.

| 확인 항목                                | 방법                                                             | 결과                                                 |
| ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `pnpm check` (test+lint+typecheck+build) | 로컬 실행                                                        | 통과                                                 |
| 홈 정상 상태                             | `/` 진입                                                         | 배너·카테고리·인기 상품·신상품 렌더                  |
| 홈/목록 로딩 상태                        | mock 500ms 지연                                                  | 스켈레톤 표시                                        |
| 상품 목록 URL 직접 진입                  | `/products?q=후디&category=all&sort=price-asc&page=1&pageSize=6` | 검색·정렬·페이지 크기 반영, 총 1개 필터링            |
| 빈 상태                                  | `/products?q=zzzzzz`                                             | "검색 결과가 없어요" Placeholder                     |
| 장바구니·위시리스트 토글                 | 찜/담기 클릭                                                     | 버튼 라벨 전환("찜"→"찜됨") + 헤더 카운트 증가       |
| 페이지 이동 간 상태 유지                 | 목록→홈 클라이언트 사이드 이동                                   | Zustand 상태·헤더 개수 유지                          |
| 뒤로/앞으로 가기                         | 브라우저 뒤로가기                                                | URL 쿼리 전부 복원 + 찜 상태 유지                    |
| 새로고침                                 | 전체 로드                                                        | Zustand 초기화 — persist 미사용은 의도된 설계        |
| mock 에러 응답                           | `GET /api/products?scenario=error`                               | 500 `{"message":"상품 목록을 불러오지 못했습니다."}` |
| mock 검증 실패                           | `GET /api/products?sort=nope`                                    | 400 `{"message":"요청 조건을 확인해주세요."}`        |
| mock 빈 응답                             | `GET /api/home?scenario=empty`                                   | 200 + 빈 배열                                        |

기준선에서 발견한 사실 2가지 (이번 설계의 출발점):

1. `error.tsx` / Error Boundary가 프로젝트에 하나도 없다. 렌더링 오류가 나면 잡을 경계가 없다.
2. mock API의 `scenario` 파라미터를 서비스 레이어가 전달하지 않아 **UI에서 에러 상태를 재현할 방법이 없다.** 에러 UI 코드는 있지만 검증된 적이 없는 상태다.

## 1. R — Requirements

### 보존할 동작 (기능 요구사항)

- 홈: 배너, 카테고리 링크, 인기 상품/신상품 섹션, 정상·로딩·에러·빈 상태
- 상품 목록: 검색(디바운스)·카테고리·정렬·페이지네이션, URL 공유·새로고침·뒤로/앞으로 가기
- 장바구니·위시리스트: 토글, 헤더 카운트, 페이지 이동 간 상태 유지
- 상태의 Source of Truth 4종(서버=TanStack Query, URL=nuqs, 전역=Zustand, UI=useState)은 폴더 이동과 무관하게 유지

### 비기능 요구사항

- 매 Phase 종료 시 `pnpm check` 통과, Phase 단위 커밋 (lint-staged 사전 커밋 통과, `--no-verify` 금지)
- 구조 변경 커밋과 동작 추가 커밋(에러 경계)을 섞지 않는다

### 이번 주에 하지 않을 것

| 항목                                 | 이유                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api` (mock 백엔드) FSD 전환 | 프론트가 아니라 "서버" 역할. 과제에서 제외 허용. 경계는 §2.8에 정의                                                                                         |
| select/dialog 데모 페이지 전환       | 3~4주차 컴포넌트 데모로 커머스 도메인이 아님. `shared/ui` 이동에 따른 import 경로 갱신만 수행. 전용 코드(`types/product.ts`, `services/products.ts`)도 유지 |
| `src/examples/week-05-layout` 정리   | 어떤 라우트에도 연결되지 않은 정적 참고용. 이동 대상과 혼동하지 않도록 손대지 않음                                                                          |
| `week05-*` CSS 클래스 정리/모듈화    | 문자열 결합이라 import 경계로 잡히지 않는 별개 주제. 구조 변경과 섞으면 diff 오염                                                                           |
| Zustand persist 도입                 | 새로고침 초기화는 의도된 설계. 기능 변경이므로 범위 밖                                                                                                      |

## 2. A — Architecture

### 2.1 현재 구조에서 실제로 겪는 문제

1. **기능 파편화** — 위시리스트 하나가 `stores/wishlist.ts` + `app/_components/product-actions.tsx` + `app/_components/header-actions.tsx` 세 곳에 흩어져 있다. 심지어 `product-actions.tsx` 한 파일에는 장바구니와 위시리스트 두 기능이 동거한다. "위시리스트를 제거하라"는 요구에 grep 없이 답할 수 없다.
2. **역방향 의존** — `ProductCard`(상품 **표현**)가 `CartButton`/`WishlistButton`(사용자 **행위**)을 직접 import한다. 표현 계층이 행위를 알아서, 행위 없는 카드가 필요한 곳에서 재사용할 수 없고 새 행위가 생길 때마다 카드를 수정해야 한다.
3. **통짜 타입 창고** — `types/commerce.ts`에 도메인 타입(`Product`, `Category`)과 API 계약(`ProductListResponse`), 심지어 mock 검증 전용 제어값(`MockApiScenario`)까지 동거한다. 각 타입의 소유자가 없고, 프론트 코드가 mock 전용 값을 import할 수 있는 구조다.
4. **에러 처리 경계 부재** — `error.tsx`/Error Boundary 0개. 모든 API 에러가 인라인 `isError` 분기로 처리되어 5xx(예상 밖)와 4xx(복구 가능)의 구분이 없고, 렌더링 오류는 잡을 곳이 없다.
5. **경계 강제 장치 부재** — `@/*` 단일 alias로 어느 폴더든 어디서나 import 가능하다. 규칙을 정해도 도구가 위반을 잡지 못한다.

### 2.2 Before / After 폴더 트리

**Before (현재)**

```
src/
  app/
    _components/        # 홈·상품·헤더 UI가 라우팅 트리 안에 혼재
    api/                # mock 백엔드 (라우트 핸들러 + fixture)
    dialog/  select/    # 컴포넌트 데모
    products/           # _components + _lib + page.tsx
    layout.tsx  page.tsx  providers.tsx
  components/ui/        # dialog, select, internal (헤드리스 UI kit)
  examples/             # 미연결 레이아웃 예시
  hooks/                # use-debounced-callback
  queries/              # commerceQueries (home + products)
  services/             # commerce.ts (fetch 래퍼+에러+API), products.ts
  stores/               # cart, wishlist, create-selection-store
  types/                # commerce.ts (통짜), product.ts
```

**After (목표)**

```
src/
  app/                          # Next.js 라우팅 전용 — 얇은 진입점
    layout.tsx  providers.tsx   # FSD App 레이어 역할 (전역 조합·프로바이더)
    page.tsx                    # export { HomePage as default } from "@/_pages/home"
    error.tsx                   # (Phase 6 신규) 루트 에러 경계
    products/page.tsx           # export { ProductListPage as default } from "@/_pages/products"
    products/error.tsx          # (Phase 6 신규)
    api/                        # mock 백엔드 — FSD 레이어 밖 (§2.8), _contract.ts에 자체 계약
    dialog/  select/            # 데모 — import 경로만 갱신
  _pages/
    home/
      ui/    home-page.tsx  home-banner.tsx  home-category-links.tsx  home-product-section.tsx
      api/   get-home.ts (getHome + HomeResponse)  queries.ts (homeQueries)
      index.ts
    products/
      ui/    product-list-page.tsx  product-filters.tsx  product-search-input.tsx  product-list-results.tsx
      api/   get-products.ts (getProducts + ProductListResponse, 파라미터는 파서 파생)  queries.ts (productListQueries)
      lib/   search-params.ts (nuqs 파서)
      index.ts
  widgets/
    header/ui/header-actions.tsx
    product-card-actions/ui/product-card-actions.tsx   # (신규) 두 feature 버튼 조합
  features/
    toggle-cart/ui/cart-button.tsx
    toggle-wishlist/ui/wishlist-button.tsx
  entities/
    product/
      ui/    product-card.tsx (actions 슬롯)  product-grid-skeleton.tsx
      model/ types.ts (Product, Category, CategoryId, ProductSort)
      index.ts
    cart/model/store.ts      + index.ts
    wishlist/model/store.ts  + index.ts
  shared/
    ui/    placeholder.tsx  toggle-button.tsx  dialog/  select/  internal/
    lib/   create-selection-store.ts  use-debounced-callback.ts
    api/   commerce-client.ts (fetchCommerceApi + CommerceApiError + ApiErrorResponse)
  types/product.ts  services/products.ts   # select 데모 전용 — 범위 제외로 유지
  examples/                                # 범위 제외로 유지
```

### 2.3 레이어 선택 근거

이 프로젝트는 작다. 모든 레이어를 만드는 것이 목표가 아니라, **필요한 레이어만 만들고 안 만든 이유를 남기는 것**이 목표다.

| 레이어      | 사용 | 근거                                                                                                                  |
| ----------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| `shared`    | O    | 도메인을 모르는 코드(헤드리스 UI kit, 디바운스 훅, HTTP 클라이언트)가 이미 존재                                       |
| `entities`  | O    | product(표현+타입), cart/wishlist(도메인 상태)의 소유자가 필요                                                        |
| `features`  | O    | 찜/담기는 홈·목록 두 페이지에서 재사용되는 사용자 행위. 행위 단위 응집(폴더째 삭제 가능)이 목적                       |
| `widgets`   | O    | 헤더(전 페이지 공통, 두 엔티티 조합)와 카드 액션(두 feature 조합) — 페이지 소유가 아닌 조합체                         |
| `_pages`    | O    | Next 라우팅 파일과 FSD 페이지를 분리. `src/pages`는 Pages Router로 오인되므로 공식 가이드대로 `_pages` 사용           |
| `_app`      | X    | `app/layout.tsx`+`providers.tsx`가 이미 최소한의 App 레이어 역할. 옮겨서 감출 내부가 없는데 레이어만 만들면 빈 레이어 |
| `processes` | X    | FSD v2.1에서 deprecated                                                                                               |

세그먼트는 목적 기준: `ui`(표현) / `model`(상태·타입) / `api`(서버 통신 — fetch 함수, queryOptions, DTO) / `lib`(슬라이스 내부 유틸). queryOptions는 쿼리키 팩토리라 로직처럼 보이지만 본질이 서버 통신 계약이므로 `api` 세그먼트에 둔다.

> **컨벤션 계보 주석 (Phase 7 추가)**: FSD 공식 문서 신판(fsd.how)의 Next.js 가이드는 라우팅 `app/`을 프로젝트 루트로 빼고 `src/` 안에 표준 이름(`src/app`, `src/pages`)을 유지하는 방식을 제시한다. 이 프로젝트는 과제 공통 규칙("`src/pages`는 만들지 않는다 — Pages Router 오인")에 따라 구판 공식 가이드의 `src/_pages` 리네임 방식을 채택했다. 신판의 이식 가능한 권장사항(라우팅 파일은 재수출만, 캐시 정책은 쿼리 정의와 동거, Route Handler의 FSD 외부 격리)은 현 구조가 이미 충족한다.

### 2.4 의존 방향 규칙

```
app(라우팅) → _pages → widgets → features → entities → shared
```

- 자기보다 아래 레이어만 import한다. 같은 레이어의 다른 슬라이스는 직접 import하지 않는다.
- 같은 슬라이스 안에서는 상대경로, 다른 슬라이스는 `@/` 절대경로(자기 슬라이스 index를 절대경로로 import하면 순환 위험).
- **적용 범위**: 이 규칙은 JS/TS import에 한정된다. `week05-*` 전역 CSS 클래스 의존(예: entities의 카드가 app 소유 스타일시트의 클래스를 문자열로 참조)은 도구가 볼 수 없는 대상 밖이며, §1에서 CSS 정리를 범위 제외한 결정과 함께 인지한다. 다음 단계에서 CSS Module을 슬라이스에 동봉하면 스타일 의존도 import 경계 위로 올라온다.

**허용 예시**

```ts
// _pages/products → entities (상위 → 하위)
import { ProductCard } from "@/entities/product";
// widgets → features (상위 → 하위)
import { CartButton } from "@/features/toggle-cart/ui/cart-button";
// features → entities → shared
import { useCartStore } from "@/entities/cart";
import { ToggleButton } from "@/shared/ui/toggle-button";
```

**금지 예시**

```ts
// entities → features : 하위가 상위를 아는 역방향 의존
import { WishlistButton } from "@/features/toggle-wishlist/ui/wishlist-button"; // in entities/product
// 같은 레이어 슬라이스 간 직접 import
import { useWishlistStore } from "@/entities/wishlist"; // in entities/cart
import { CartButton } from "@/features/toggle-cart/ui/cart-button"; // in features/toggle-wishlist
// shared가 도메인을 아는 것
import type { Product } from "@/entities/product"; // in shared/*
```

### 2.5 파일 매핑표

**이동하는 파일**

| 현재 위치                                                                | 목표 위치                                                                    | 레이어/세그먼트    | 이동 이유                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `components/ui/dialog/**` (9파일)                                        | `shared/ui/dialog/**`                                                        | shared/ui          | 도메인 지식 없는 compound 컴포넌트                                                                            |
| `components/ui/select/**` (2파일)                                        | `shared/ui/select/**`                                                        | shared/ui          | 동일                                                                                                          |
| `components/ui/internal/**` (8파일)                                      | `shared/ui/internal/**`                                                      | shared/ui          | dialog/select의 내부 프리미티브                                                                               |
| `hooks/use-debounced-callback.ts`                                        | `shared/lib/use-debounced-callback.ts`                                       | shared/lib         | 범용 훅, 도메인 무관                                                                                          |
| `stores/create-selection-store.ts`                                       | `shared/lib/create-selection-store.ts`                                       | shared/lib         | 비즈니스 용어를 모르는 범용 선택 메커니즘                                                                     |
| `services/commerce.ts`의 `fetchCommerceApi`, `CommerceApiError`          | `shared/api/commerce-client.ts`                                              | shared/api         | 도메인 무관 HTTP 클라이언트. status 보유 에러는 Phase 6 throwOnError의 기반                                   |
| `types/commerce.ts`의 `ApiErrorResponse`                                 | `shared/api/commerce-client.ts`                                              | shared/api         | 도메인 무관 전송 계약                                                                                         |
| `types/commerce.ts`의 `Product`, `Category`, `CategoryId`, `ProductSort` | `entities/product/model/types.ts`                                            | entities/model     | 소유자가 명확한 도메인 타입 (§2.6-5)                                                                          |
| `types/commerce.ts`의 `MockApiScenario`                                  | `app/api/_contract.ts`                                                       | (mock — 레이어 밖) | 검증 전용 제어값. 프론트가 물리적으로 import할 수 없는 위치로                                                 |
| `types/commerce.ts`의 `ProductListResponse`                              | `_pages/products/api/get-products.ts` — **내부 전용**, index로 공개하지 않음 | _pages/api         | 쿼리 소유자(§2.6-2) 옆에 계약 배치. mock은 자체 사본 사용(§2.8)                                               |
| `types/commerce.ts`의 `ProductListQuery`                                 | **독립 정의 삭제** — nuqs 파서의 `inferParserType`에서 파생                  | _pages/lib → api   | 같은 모양의 계약 중복 제거 (§2.6-8)                                                                           |
| `types/commerce.ts`의 `HomeResponse`                                     | `_pages/home/api/get-home.ts` — **내부 전용**                                | _pages/api         | banner 등 상품 외 데이터를 포함한 홈 전용 집계. mock은 자체 사본 사용(§2.8)                                   |
| (신규)                                                                   | `app/api/_contract.ts`                                                       | (mock — 레이어 밖) | mock이 소유하는 응답 봉투 타입(`HomeResponse`·`ProductListResponse` 사본) — 네트워크 경계 양쪽의 독립성(§2.8) |
| `services/commerce.ts`의 `getProducts`, `ProductListParams`              | `_pages/products/api/get-products.ts`                                        | _pages/api         | 소비처가 상품 목록 페이지 1곳                                                                                 |
| `services/commerce.ts`의 `getHome`                                       | `_pages/home/api/get-home.ts`                                                | _pages/api         | 소비처가 홈 1곳                                                                                               |
| `queries/commerce.ts`의 `products()`                                     | `_pages/products/api/queries.ts`                                             | _pages/api         | queryKey·staleTime·keepPreviousData 유지한 채 이동                                                            |
| `queries/commerce.ts`의 `home()`                                         | `_pages/home/api/queries.ts`                                                 | _pages/api         | 동일                                                                                                          |
| `stores/cart.ts`                                                         | `entities/cart/model/store.ts`                                               | entities/model     | 여러 상위 슬라이스가 공유하는 도메인 상태 (§2.6-4)                                                            |
| `stores/wishlist.ts`                                                     | `entities/wishlist/model/store.ts`                                           | entities/model     | 동일                                                                                                          |
| `app/_components/product-card.tsx`                                       | `entities/product/ui/product-card.tsx`                                       | entities/ui        | 순수 표현으로 변경 — 버튼 직접 import 제거, `actions: ReactNode` 필수 슬롯 추가 (§4.2)                        |
| `app/_components/product-grid-skeleton.tsx`                              | `entities/product/ui/product-grid-skeleton.tsx`                              | entities/ui        | 스켈레톤 구조가 카드 필드에 종속 (§2.6-7)                                                                     |
| `app/_components/placeholder.tsx`                                        | `shared/ui/placeholder.tsx`                                                  | shared/ui          | title/description/action만 아는 범용 표시                                                                     |
| `app/_components/product-actions.tsx`의 `WishlistButton`                 | `features/toggle-wishlist/ui/wishlist-button.tsx`                            | features/ui        | 사용자 행위 단위 격리 — 폴더째 삭제 가능해야 함                                                               |
| `app/_components/product-actions.tsx`의 `CartButton`                     | `features/toggle-cart/ui/cart-button.tsx`                                    | features/ui        | 동일                                                                                                          |
| `app/_components/product-actions.tsx`의 `ActionButton`(내부)             | `shared/ui/toggle-button.tsx`                                                | shared/ui          | 문구 없는 aria-pressed 버튼 — 두 feature가 같은 레이어 간 import 없이 공유하는 방법                           |
| `app/_components/header-actions.tsx`                                     | `widgets/header/ui/header-actions.tsx`                                       | widgets/ui         | 전 페이지 레이아웃 소속, cart+wishlist 두 엔티티 조합                                                         |
| (신규)                                                                   | `widgets/product-card-actions/ui/product-card-actions.tsx`                   | widgets/ui         | 두 feature 버튼을 카드용 한 덩어리로 조합, 홈·목록이 재사용                                                   |
| `app/page.tsx` 본문                                                      | `_pages/home/ui/home-page.tsx`                                               | _pages/ui          | 라우팅 파일은 1줄 재수출로 축소                                                                               |
| `app/_components/home-banner.tsx` 외 home-* 2개                          | `_pages/home/ui/`                                                            | _pages/ui          | 홈 전용, 재사용처 없음                                                                                        |
| `app/products/page.tsx` 본문                                             | `_pages/products/ui/product-list-page.tsx`                                   | _pages/ui          | 라우팅 파일은 1줄 재수출로 축소                                                                               |
| `app/products/_components/**` (3파일)                                    | `_pages/products/ui/`                                                        | _pages/ui          | 상품 목록 페이지 전용 (§8-2)                                                                                  |
| `app/products/_lib/search-params.ts`                                     | `_pages/products/lib/search-params.ts`                                       | _pages/lib         | 이 라우트만의 URL 상태 계약                                                                                   |

**그 자리에 남기는 파일**

| 위치                                                                       | 유지 이유                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `app/layout.tsx`, `app/providers.tsx`, `globals.css`, `week-05-layout.css` | Next가 강제하는 전역 진입점 = FSD App 레이어 역할. import 경로만 갱신                  |
| `app/api/**` (라우트 3 + fixture + 테스트 3)                               | mock 백엔드 — 범위 제외 (§2.8)                                                         |
| `app/select/**`, `app/dialog/**`                                           | 데모 — `@/shared/ui/*`로 import 경로만 갱신                                            |
| `types/product.ts`, `services/products.ts`                                 | select 데모 전용 타입·fetch. commerce와 실행 맥락(절대경로 fetch)도 달라 통합하지 않음 |
| `examples/week-05-layout/**`                                               | 미연결 참고용                                                                          |

### 2.6 애매한 파일 결정표

| 대상                       | 후보 A                                 | 후보 B                                                  | 최종 결정                  | 기준                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | -------------------------------------- | ------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `ProductCard`           | `entities/product/ui`                  | `widgets/product-card`                                  | **entities/product/ui**    | 재사용 범위(홈+목록 2곳)와 포함한 비즈니스 행위(없음 — 순수 표현). 행위는 `actions` 슬롯으로 받아 widget에서 조합                                                                                                                                                                                                                                                                                                |
| 2. 상품 목록 queryOptions  | `entities/product/api`                 | `_pages/products/api`                                   | **\_pages/products/api**   | 소비처가 상품 목록 페이지 1곳뿐. **승격 조건 기록**: 상품 상세·카테고리 페이지 등 두 번째 소비처가 생기면 `entities/product/api`로 올린다 (mock은 자체 계약을 쓰므로(§2.8) 승격은 프론트 내부 리팩터로 한정 — 이동 비용 실측 3파일: get-products.ts, queries.ts, import 갱신 1곳. 이 수치가 커지는 시점이 곧 승격 신호다)                                                                                        |
| 3. 홈 queryOptions         | `entities/product/api`                 | `_pages/home/api`                                       | **\_pages/home/api**       | `HomeResponse`가 banner 등 상품 외 데이터를 포함한 페이지 전용 집계. 엔티티에 넣으면 무관한 데이터가 유입                                                                                                                                                                                                                                                                                                        |
| 4. 장바구니 store          | `entities/cart/model`                  | `features/toggle-cart/model`                            | **entities/cart/model**    | 헤더(읽기)와 버튼(쓰기), 여러 상위 슬라이스가 공유하는 도메인 상태. 특정 행위의 생명주기에 종속되지 않음                                                                                                                                                                                                                                                                                                         |
| 5. `Product` 타입          | `entities/product/model`               | `shared/types` 유지                                     | **entities/product/model** | 손으로 작성한, 소유자가 명확한 도메인 타입. 통짜 창고에 두면 무관한 변경이 전 소비처 diff를 오염. (참고: openapi-generator 같은 **생성** 계약이라면 shared/api가 자연스럽지만, 이건 생성 코드가 아니다)                                                                                                                                                                                                          |
| 6. `createSelectionStore`  | `shared/lib`                           | `entities/cart·wishlist` 옆                             | **shared/lib**             | shared 판별 기준은 "어디서나 쓰이는가"가 아니라 "도메인 용어를 아는가". `Set<string>` toggle뿐 — 커머스인지도 모름                                                                                                                                                                                                                                                                                               |
| 7. `ProductGridSkeleton`   | `shared/ui`                            | `entities/product/ui`                                   | **entities/product/ui**    | props만 보면 범용이지만 스켈레톤 라인 구조(이미지+제목+가격)가 `ProductCard` 필드에 종속 — 카드가 바뀌면 함께 바뀌는 응집 관계                                                                                                                                                                                                                                                                                   |
| 8. `ProductListQuery` 타입 | 독립 정의 유지 (`_pages/products/api`) | nuqs 파서에서 파생(`inferParserType`) 후 독립 정의 삭제 | **파서 파생**              | §3이 URL을 검색 조건의 SoT로 선언했으므로 같은 모양의 계약을 lib(파서)와 api(타입)에 이중 정의하면 소유자가 둘이 된다. 같은 슬라이스 내 세그먼트 협력(lib→api)이라 방향 위반 없음. 파서 sort 리터럴에는 `satisfies readonly ProductSort[]` 정합 검증을 **Phase 5에서 도입**한다(현재 코드의 satisfies는 mock 라우트에만 존재) — 이때 `_pages/products/lib → @/entities/product` 의존이 처음 생긴다(정방향, 합법) |
| 9. 카드 행위의 조합 지점   | `widgets/product-card-actions`         | `_pages` 홈·목록 각각에서 직접 조합                     | **widgets**                | 동일한 조합(찜+담기)을 두 페이지가 사용하므로 후보 B는 중복 코드를 낳는다. 소비처 2곳은 widget 승격 근거(§4.3 리트머스 1번 충족). 파일 1개짜리 widget이지만 조합 지점이 1곳으로 수렴하는 실익이 명확                                                                                                                                                                                                             |

### 2.7 마이그레이션 Phase (Phase = 커밋 1개, 매 Phase `pnpm check` 통과 후 커밋)

| Phase | 내용                                                                                                                                                                                                                     | 검증                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 0     | 이 RFC 커밋 (코드 변경 없음)                                                                                                                                                                                             | —                                                                                                                                 |
| 1     | `shared` 구성: components/ui → shared/ui, 훅·팩토리 → shared/lib, fetch 래퍼+에러 → shared/api. 데모 페이지 import 갱신. **+ (Advanced A) ESLint 의존성 하네스 도입(§2.9)** — 아직 없는 폴더의 glob 규칙은 무해하게 대기 | `pnpm check` + 의도적 위반 import 2종으로 하네스 실패 재현 → 원복 기록                                                            |
| 2     | `entities` 구성: product(model/ui + actions 슬롯), cart, wishlist. `types/commerce.ts` 분해·삭제, mock 라우트 import 갱신                                                                                                | `pnpm check`                                                                                                                      |
| 3     | `features` 구성: toggle-cart, toggle-wishlist. `product-actions.tsx` 삭제                                                                                                                                                | `pnpm check`                                                                                                                      |
| 4     | `widgets` 구성: header 이동, product-card-actions 신규. 카드 소비처를 슬롯 주입으로 전환                                                                                                                                 | `pnpm check` + 기준선 핵심 3행(토글·이동 간 유지·URL 직접 진입) 수동 재실행 — 슬롯 전환이 이번 마이그레이션의 최대 동작 변경 지점 |
| 5     | `_pages` 구성: home, products 이관. `app/*/page.tsx`를 1줄 재수출로 축소. `queries/` `services/` `stores/` `hooks/` `components/` 폴더 소멸                                                                              | `pnpm check` + 기준선 수동 확인 전체 재실행                                                                                       |
| 6     | 에러 경계 (유일한 동작 추가 커밋): throwOnError 기준 + `error.tsx` 2개 + QueryErrorResetBoundary                                                                                                                         | `pnpm check` + `scenario=error` 임시 주입으로 재현 (§5.3)                                                                         |
| 7     | 삭제 시나리오 실측 → 이 RFC의 §7 갱신                                                                                                                                                                                    | 사고 실험 결과 기록                                                                                                               |

(Advanced A 하네스는 architecture-review 리뷰 수용에 따라 Phase 8에서 Phase 1로 앞당김 — §9)

이동과 옛 파일 삭제는 같은 커밋에 묶는다(두 경로가 동시에 살아있으면 typecheck가 불일치를 못 잡는다). 각 Phase에서 아직 이동하지 않은 상위 코드는 새 경로를 import하도록 그 커밋에서 함께 갱신한다.

#### 실행 기록 (Phase 7에서 실측 기입)

| Phase | 커밋                  | 검증 결과                                                                                                                                              |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | `b719875d`            | RFC 커밋 (코드 변경 없음)                                                                                                                              |
| 1     | `173f59f3`            | `pnpm check` 통과. 하네스 의도적 위반 4종 재현 → 원복 (§9 검증 기록)                                                                                   |
| 2     | `3a7dabd2`            | `pnpm check` 통과. `actions` **required** 설계가 미주입 소비처 2곳을 typecheck로 즉시 차단 — §4.2의 "침묵 버그 방지"가 실제로 작동한 첫 사례           |
| 3     | `cca5b82f`            | `pnpm check` 통과. 분해 이동 중 소실된 `"use client"` 지시어 3건을 리뷰에서 발견·복원 (원본 보존 원칙)                                                 |
| 4     | `667f347d`            | `pnpm check` + 기준선 핵심 3행(URL 직접 진입·토글→카운트·이동 간 유지) 브라우저 재실행 통과. 목록에서 토글한 카드가 홈에서 "찜됨"으로 표시됨을 확인    |
| 5     | `9157fba8` `a43971fd` | `pnpm check` + 기준선 전체 재실행 통과(검색 디바운스→URL, 정렬, 페이지네이션, 뒤로가기 복원, 빈 상태). 진행 중 mock 계약 역수입 발견 → 하네스 보강(§9) |
| 6     | `fe5b662d`            | `pnpm check` + `scenario=error` 임시 주입 재현 통과 (§5.3 재현 결과), 임시 코드 제거 확인                                                              |
| 7     | (이 문서 갱신)        | 삭제 시나리오 실측 (§7)                                                                                                                                |

### 2.8 mock 백엔드와의 경계 — 2단 경계

`src/app/api/**`는 FSD 레이어 시스템 **밖**의 "서버"로 간주하고, 프론트 레이어와의 결합을 두 단계로 나눈다.

1. **응답 봉투 타입은 공유하지 않는다** — `HomeResponse`, `ProductListResponse`는 mock이 `app/api/_contract.ts`에 자체 정의하고, 프론트는 `_pages/*/api`에 자기 몫을 내부 전용으로 정의한다(각 4~5필드의 **의도적 중복**). "실제 백엔드가 생기면 OpenAPI 등 외부 계약으로 대체될 자리"라는 전제는 경계 양쪽이 독립 타입을 가질 때 성립하며, mock 사정으로 `_pages`의 Public API가 넓어지는 문제(§4.3 리트머스 위반)도 함께 사라진다.
2. **도메인 모델 타입은 entities에서 type-only로 가져온다** — `Product`(13필드)·`Category`·`CategoryId`·`ProductSort`는 fixture 30개가 쓰는 타입이라 중복하면 드리프트 위험이 독립성의 실익보다 크다. entities는 가장 안정적인 최하위 도메인 레이어이므로 `import type`에 한해 참조를 허용하고, §2.9의 하네스(`allowTypeImports`)로 강제한다. 값 import를 금지하는 이유: 라우트 핸들러의 모듈 그래프에 클라이언트 모듈이 끌려 들어가는 사고를 차단하기 위함.

`MockApiScenario`는 검증 전용 제어값이므로 `app/api/_contract.ts`에 두어 프론트가 import할 수 없게 한다.

> **`_contract.ts`의 위치가 `_pages`가 아닌 이유 (Phase 7 추가)**: "실사용처 옆"이라는 기준으로 보면 프론트 몫의 계약은 이미 사용처인 `_pages/*/api`에 있다. `_contract.ts`는 사용처용 타입이 아니라 **mock 서버 자신의 계약**이므로 mock 코드가 사는 `app/api/**`에 동거한다. `_pages`로 옮기면 ① mock 라우트가 상위 레이어(`@/_pages`)를 아는 역방향 결합이 생기고 ② 실제 백엔드 도입 시 `app/api` 폴더째 삭제하는 시나리오가 깨진다(계약이 프론트 폴더에 남음).

### 2.9 의존성 하네스 (Advanced A — Phase 1에서 도입)

§2.1-5("규칙을 정해도 도구가 위반을 잡지 못한다")를 문제로 선언하고 해결을 마지막 Phase에 두면 Phase 1~6 여섯 커밋 동안 사람 눈으로만 검사하는 자기모순이 생긴다. 하네스는 **Phase 1 커밋에 포함**한다 — 아직 존재하지 않는 폴더에 대한 glob 규칙은 무해하게 대기하다가 폴더가 생기는 즉시 작동한다.

`@typescript-eslint/no-restricted-imports` + flat config의 파일 glob 스코프로 구현한다(새 의존성 불필요).

1. **레이어 랭크 규칙** — 각 레이어 폴더에서 상위 레이어 alias import 금지
   - `src/shared/**` → `@/entities/*`, `@/features/*`, `@/widgets/*`, `@/_pages/*` 금지
   - `src/entities/**` → `@/features/*`, `@/widgets/*`, `@/_pages/*` 금지
   - `src/features/**` → `@/widgets/*`, `@/_pages/*` 금지
   - `src/widgets/**` → `@/_pages/*` 금지
   - 모든 FSD 레이어 → `@/app/*` 금지 (Phase 5 실측 보강 — `_pages`가 mock의 `_contract`를 역수입한 사례가 이 갭을 드러냄, §9 기록)
2. **같은 레이어 슬라이스 간 직접 import 금지** — "같은 슬라이스 내부는 상대경로"(§2.4) 규칙 덕분에, 레이어 폴더 안에서 자기 레이어의 alias 전체를 금지하는 것으로 구현된다
   - `src/entities/**` 안에서 `@/entities/*` 금지(cart→wishlist 차단), `features`·`widgets`·`_pages`도 동일
3. **mock 존 규칙(§2.8 강제)** — `src/app/api/**` → `@/_pages/*`·`@/widgets/*`·`@/features/*`·`@/shared/*` 금지, `@/entities/*`는 `allowTypeImports: true`로 타입만 허용
4. **Public API 계약 강제(§4.3)** — index를 만든 슬라이스는 루트로만 진입한다
   - 전역에서 `@/entities/*/*`, `@/_pages/*/*` 딥 임포트 금지 — `@/entities/product`(슬라이스 루트)는 허용, `@/entities/product/ui/product-card`는 차단. index가 없는 features/widgets는 딥 임포트가 규범이므로 대상 아님
   - `src/{entities,features,widgets,_pages}/**`에서 `../../*` import 금지 — alias 규칙의 상대경로 우회 차단. 슬라이스 내부(슬라이스/세그먼트/파일 2단 구조)에서 `../`는 세그먼트 간 협력에 충분하고 `../../`는 항상 슬라이스 밖으로 나간다

전제 2가지를 함께 기록한다. ① `src/app/**`(라우팅)에는 규칙 객체를 정의하지 않는다 — 최상위 레이어라 모든 하위 import가 허용되기 때문이다. 단 flat config에서 같은 rule의 options는 병합이 아니라 **교체**이므로, 나중에 `src/app/**` 규칙을 추가한다면 mock 존 객체(규칙 3)가 반드시 뒤에 와야 한다. ② 같은 레이어 차단(규칙 2)에 정말 막히는 날이 오면(예: `entities/cart`가 `Product` 타입이 필요해지는 순간) 탈출구는 FSD 공식 cross-import 표기 **`@x`**(`entities/product/@x/cart`)이지, 규칙을 끄는 것이 아니다 — 규칙을 처음 어기고 싶어지는 순간의 판례를 미리 남긴다.

검증: 의도적 위반 import 4종(entities→features 역방향, features 슬라이스 간, entities 딥 임포트, `../../` 상대경로 탈출)을 임시 작성해 lint 실패를 확인하고 원복한다. 결과는 §9에 기록.

## 3. D — 상태 분류표

| 상태                | Source of Truth            | 소유 슬라이스/레이어                                                                                           | 소비하는 곳                                       | 이동 후에도 중복 저장하지 않는 방법                                                                                                 |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 상품 조회 결과      | 서버 / TanStack Query 캐시 | queryOptions는 `_pages/home/api`·`_pages/products/api`, 캐시 인스턴스는 `app/providers.tsx`의 단일 QueryClient | 홈, 상품 목록                                     | 컴포넌트는 `useQuery` 구독만 한다. 응답을 Zustand/useState로 복사하지 않고, 파생값(totalPages 등)은 렌더 시 계산                    |
| 검색·정렬·페이지    | URL / nuqs                 | 파서 정의: `_pages/products/lib/search-params.ts`                                                              | 상품 목록                                         | `useQueryStates`가 URL을 직접 읽고 쓴다. 검색 입력 초안(useState)은 debounce 커밋 전 임시값일 뿐 SoT가 아니며, 커밋 시 URL로만 반영 |
| 장바구니·위시리스트 | Zustand                    | `entities/cart/model`, `entities/wishlist/model`                                                               | `widgets/header`(읽기), `features/toggle-*`(쓰기) | store에는 `productId`만 저장(서버 상품 데이터를 복사하지 않음). 개수는 `state.ids.size` selector로 파생                             |
| Dialog 열림 여부    | React 로컬 상태            | `shared/ui/dialog` (useControllableState)                                                                      | 데모 페이지                                       | controlled/uncontrolled 단일 소유. 열림 상태를 다른 저장소에 미러링하지 않음                                                        |

## 4. I — Interface

### 4.1 슬라이스별 공개 / 은닉

| 슬라이스                         | 공개 (index.ts)                                                                          | 숨기는 것                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `entities/product`               | `ProductCard`, `ProductGridSkeleton`, `Product`, `Category`, `CategoryId`, `ProductSort` | ui 파일 구조, 카드 마크업                                                       |
| `entities/cart`                  | `useCartStore`                                                                           | store 생성 방식(createSelectionStore 사용 여부)                                 |
| `entities/wishlist`              | `useWishlistStore`                                                                       | 동일                                                                            |
| `_pages/home`                    | `HomePage`                                                                               | 섹션 컴포넌트, 쿼리·fetch, `HomeResponse` 내부 계약                             |
| `_pages/products`                | `ProductListPage`                                                                        | 필터·검색·결과 컴포넌트, nuqs 파서, `ProductListResponse` 내부 계약             |
| `features/toggle-*`, `widgets/*` | index 없음 — 파일 직접 import                                                            | (숨길 내부가 없음)                                                              |
| `shared/*`                       | 세그먼트 루트 index 없음 — `@/shared/ui/placeholder`처럼 모듈별 import                   | `shared/ui/dialog/index.tsx`·`select/index.tsx`는 compound 조립 계약이므로 유지 |

모든 index.ts는 **서버 모듈로 유지**한다 — index에 `"use client"`를 붙이면 경계가 슬라이스 Public API 전체로 올라가 이후 그 슬라이스에 서버 전용 코드를 넣을 수 없게 된다. 지시어는 그것이 필요한 leaf 파일(예: `_pages/products/ui/product-list-page.tsx`)에만 둔다. 서버 모듈이 클라이언트 모듈을 재수출하는 것은 정상 동작이다.

### 4.2 `ProductCard`와 행위의 조합

```tsx
// entities/product/ui/product-card.tsx — 행위를 모르는 순수 표현
type ProductCardProps = {
  product: Product;
  titleAs?: "h2" | "h3";
  actions: ReactNode; // 행위는 슬롯으로 주입받는다 — required (§9 2차 리뷰 수용)
};

// widgets/product-card-actions/ui/product-card-actions.tsx — 두 feature 조합
<WishlistButton productId={productId} label={label} />
<CartButton productId={productId} label={label} />

// _pages/home, _pages/products — 조합 지점
<ProductCard product={p} actions={<ProductCardActions productId={p.id} label={p.name} />} />
```

`entities/product`는 features를 전혀 모른다(역방향 의존 해소). 두 feature도 서로를 모르고, 조합 책임은 widget 한 곳에만 있다.

`actions`를 **required**로 둔 이유: optional이면 소비처에서 주입을 빼먹어도 typecheck·build가 전부 통과하면서 찜/담기 버튼이 조용히 사라진다(이번 마이그레이션의 최대 침묵 버그 경로). 현재 소비처 2곳 모두 버튼을 렌더하므로 required가 현실과 일치하고, 행위 없는 카드가 실제로 필요해지는 시점에 optional로 완화한다 — 근거가 생긴 뒤의 완화.

### 4.3 Public API 결정 — barrel이 아니라 계약

- **barrel file**: 경로를 줄이려고 습관적으로 재수출하는 파일. 숨길 의도가 없다.
- **Public API**: "외부가 알아도 되는 것은 이것뿐"이라는 계약.

이 프로젝트는 **선별 생성**을 택한다. 리트머스 3문항 중 하나라도 Yes면 index를 만든다:

1. 소비처가 2곳 이상인가?
2. 숨기고 싶은 내부 파일이 2개 이상인가?
3. 내부 파일명이 바뀔 때 소비자가 몰라야 하는가?

→ `entities/*`(소비처 여럿), `_pages/*`(Next 라우팅 파일과의 경계 계약)에만 생성. `features/*`·`widgets/*`는 파일 1개·소비처 1곳이라 index를 만들면 경로만 짧아지는 barrel이므로 만들지 않는다. 모든 index는 **명시적 named 재수출**만 사용하고 `export *`는 금지한다(이름 충돌·tree-shaking·순환 의존 예방).

## 5. O — Optimization

### 5.1 TanStack Query 캐시 정책 — 유지

폴더 이동은 캐시 정책 변경의 근거가 아니다. queryKey와 옵션을 그대로 옮긴다.

| 쿼리      | 정책                                        | 유지 근거                                                |
| --------- | ------------------------------------------- | -------------------------------------------------------- |
| 전역 기본 | staleTime 20s                               | 기존 동작 보존                                           |
| home      | staleTime 5m                                | 배너·큐레이션은 저변동 데이터                            |
| products  | staleTime 1m, gcTime 5m, `keepPreviousData` | 페이지네이션·필터 변경 시 이전 결과를 유지해 깜빡임 방지 |

### 5.2 로딩 경계

route `loading.tsx`는 만들지 않는다. 현재 인라인 스켈레톤이 `pageSize`에 맞춘 개수 등 route 전역 fallback보다 정밀하고, 데이터 로딩의 주체가 클라이언트 useQuery(`isLoading`)이기 때문이다. `_pages/products`의 `Suspense`는 nuqs `useQueryStates`의 요구사항이지 데이터 로딩용이 아니므로 그대로 둔다.

### 5.3 에러 처리 경계 (Phase 6에서 구현)

| 실패 유형                                | 처리 위치                                               | Error Boundary로 전파하는가 | 사용자 UI                                   | 재시도 방법                                               | 이 경계를 선택한 이유                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------- | --------------------------- | ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 상품 목록/홈 조회 실패 (5xx)             | queryOptions의 `throwOnError` → 가장 가까운 `error.tsx` | **예**                      | 세그먼트 fallback (헤더는 경계 밖이라 유지) | fallback의 reset 버튼 → Query 에러 reset + Next `reset()` | 서버측 예외는 사용자가 조건을 바꿔 복구할 수 없음 — 명확한 경계로 격리하고 재시도 진입점을 단일화                                                                                                             |
| 잘못된 검색 조건 (4xx)                   | 페이지 인라인 `isError` 분기                            | 아니오                      | Placeholder(alert) + "다시 시도" 버튼       | `refetch()` — 전체 새로고침 없음                          | 복구 가능한 오류. 현재는 nuqs 리터럴 파서가 항상 유효값만 만들어 UI에서 도달 불가하지만, 입력 경로가 늘 때를 대비해 화면을 가리지 않는 정책으로 고정                                                          |
| 예상하지 못한 렌더링 오류                | route segment `error.tsx`                               | **예**                      | fallback + reset 버튼                       | `reset()`                                                 | 동기 렌더 예외는 로컬 상태로 복구 불가 — 상위 경계가 유일한 안전망                                                                                                                                            |
| 장바구니/위시리스트 행위의 비즈니스 오류 | **해당 없음**                                           | 아니오                      | —                                           | —                                                         | 현재는 실패 경로가 없는 순수 로컬 Zustand 토글. 서버 동기화(재고 확인 등)가 도입되면 해당 핸들러 안에서 try/catch + 인라인 알림으로 처리 — 사용자 행위 실패로 화면 전체를 가리지 않기 위해 경계로 보내지 않음 |

- **throwOnError 기준**: `error instanceof CommerceApiError && error.status >= 500` → 경계 전파. 4xx·빈 결과(200 + 빈 배열)는 인라인. 표의 "전파하는가" 열과 일치.
- `error.tsx` 배치: `app/error.tsx`(루트 — 홈 커버 + 전역 안전망), `app/products/error.tsx`(목록 세그먼트 독립 복구). 두 곳 모두 `useQueryErrorResetBoundary`와 연동해 reset 시 쿼리 에러 상태를 함께 지운다. layout(헤더)은 경계 밖이므로 에러 중에도 장바구니 카운트가 유지된다.
- **Error Boundary가 못 잡는 것**: 이벤트 핸들러·비동기 콜백의 오류는 렌더 밖이라 경계에 도달하지 않는다. 이런 오류는 발생 지점의 핸들러 내부에서 처리한다(현재 toggle은 실패 경로 없음 — 위 표 4행).
- **재현 방법**: 검증 시에만 fetch URL에 `scenario=error`를 임시 하드코딩해 5xx 전파를 확인하고 **커밋 전 제거**한다. `scenario`는 mock 전용 제어값이므로 사용자 URL 상태나 `ProductListQuery`에 포함하지 않는다(타입도 mock 폴더로 이동해 구조적으로 차단).

#### 재현 결과 (Phase 6 실측)

`scenario=error` 임시 주입(get-home·get-products 2곳, 검증 후 제거 확인)으로 재현했다.

1. **5xx → 경계 전파** ✅ — `/products`에서 `ProductListContent`가 언마운트되고 `app/products/error.tsx` fallback이 렌더(제목 + `CommerceApiError.message`). 홈은 루트 `app/error.tsx`로 전파. 인라인 분기가 아니라 경계로 갔음을 콘텐츠 언마운트로 확인.
2. **나머지 화면 생존** ✅ — 에러 중에도 layout(헤더·장바구니/위시리스트 카운트)이 유지됨. 요구사항 "조회 실패가 화면 전체를 가리지 않는다" 충족.
3. **전체 새로고침 없는 재시도** ✅ — fallback의 "다시 시도" 클릭 시 네트워크 로그에 새 `/api/products` 요청이 발생(`resetQueryErrors()` → Next `reset()` → 리마운트 refetch). mock이 계속 500이면 다시 경계로 — 루프 완결.
4. **빈 결과·4xx 인라인 유지** ✅ — `q=zzzzzz`는 200+빈 배열로 `Placeholder(role="status")` 인라인 렌더(Phase 5 기준선 재실행에서 확인). 4xx는 UI 도달 불가 경로임을 mock 직접 호출(400)로만 확인 — 표 2행의 "도달 불가하나 정책 고정" 그대로.

재현 중 환경 특이사항: 브라우저 탭이 숨겨진 상태에서는 Chrome이 타이머를 동결해 TanStack Query의 재시도 백오프(기본 3회, 1s→2s→4s)가 진행되지 않는다. 검증 시에만 임시 `retry: false`를 함께 사용해 타이머 없이 에러 상태에 도달시켰고 역시 제거했다(운영 재시도 정책 무변경).

### 5.4 이번 주에 하지 않을 최적화

- 리스트 가상화, `React.memo` 일괄 적용 — 30개 상품 규모에서 근거 없는 복잡도
- 번들 분석·코드 스플리팅 튜닝 — 구조 변경과 별개 주제
- 이미지 최적화 설정 변경 — next/image 기본값으로 충분

## 6. 트레이드오프

**장점**

- 기능 단위 응집: 기능 추가·삭제가 폴더 단위가 된다 (§7 삭제 시나리오로 검증)
- 의존 방향이 단방향으로 고정되어 순환 의존을 구조적으로 방지
- "이 파일은 어디에?"의 답이 레이어 판단 기준으로 수렴 — 미래의 내가 위치를 예측 가능

**단점 / 비용**

- 마이그레이션 비용: 거의 모든 import 경로가 바뀐다 (Phase 분할 + 매 Phase `pnpm check`로 완화)
- FSD 학습 곡선: 레이어·세그먼트 배치 판단 비용이 든다 (이 RFC의 결정표가 판례 역할)
- 파일 수 증가: `product-actions.tsx` 1개가 4개 파일(feature 2 + shared 1 + widget 1)로 늘어난다 — 응집을 위해 수용. 단 이 구조가 개선하는 지표는 "터치 파일 수"가 아니라 **"기능과 무관한 파일을 건드리는 횟수 = 0"**이다(§7 기능 추가 시나리오 표): 현재 구조에서는 행위 하나를 추가하면 다른 기능과 동거하는 파일을 수정해야 하지만, 새 구조에서는 신규 파일 + 조합 지점 1줄 편집으로 끝난다

## 7. 삭제 시나리오 (예측 → Phase 7 실측 완료)

### "위시리스트 기능을 통째로 제거한다면"

**사전 예측**

- **삭제**: `entities/wishlist/` 폴더, `features/toggle-wishlist/` 폴더 — 2개 폴더로 끝
- **수정**: `widgets/header/ui/header-actions.tsx`(카운트 span 제거), `widgets/product-card-actions/ui/product-card-actions.tsx`(버튼 1줄 제거) — 2개 파일
- `entities/product`, `_pages/*`, `shared/*`는 무변경 (`ProductCard`는 불투명한 `actions` 노드만 받으므로)

**실측 (마이그레이션 완료 후 `wishlist` 대소문자 무시 grep — src 전체)**

```
src/entities/wishlist/index.ts            ← 삭제 대상 폴더 1
src/entities/wishlist/model/store.ts
src/features/toggle-wishlist/ui/wishlist-button.tsx   ← 삭제 대상 폴더 2
src/widgets/header/ui/header-actions.tsx              ← 수정 (카운트 1줄 + import)
src/widgets/product-card-actions/ui/product-card-actions.tsx  ← 수정 (버튼 1줄 + import)
```

**예측과 정확히 일치** — 5개 파일 전부가 삭제 2폴더 + 수정 2파일 안에 있고, `app/`·`shared/`·`entities/product`·`_pages/*`에는 위시리스트의 흔적이 0건이다. grep 없이도 삭제 범위를 폴더 이름만으로 예측할 수 있는 구조 = 응집 성공. (비교: 마이그레이션 전에는 `stores/wishlist.ts` + cart와 동거하는 `product-actions.tsx` + `header-actions.tsx` + 카드의 직접 import까지 4곳에 파편화되어 있었다.)

### "신상품 뱃지를 상품 카드에 추가한다면"

**사전 예측**

- **수정**: `entities/product/ui/product-card.tsx` (뱃지 렌더)
- **신규(필요시)**: `entities/product/lib/is-new-product.ts` (`createdAt` 기반 순수 판정 — 이때 처음 lib 세그먼트 생성), CSS 클래스
- 상위 레이어(`_pages`, `widgets`, `features`)는 무변경 — 카드 표현의 유일한 소유자가 entities이기 때문

**실측 (구조 확인)**

- 판정 재료 `Product.createdAt`은 `entities/product/model/types.ts`에 이미 존재 — 새 데이터·API 변경 불필요
- 카드 마크업의 소유자는 `entities/product/ui/product-card.tsx` 한 곳뿐(홈·목록은 `<ProductCard>`를 Public API로만 소비) — 뱃지 렌더 추가가 이 파일 밖으로 번질 경로가 없음
- 터치 파일 확정: `product-card.tsx` 1개 (+판정 함수를 분리하면 `lib/is-new-product.ts` 신규 1개, 스타일이 필요하면 `week-05-layout.css`) — 예측 그대로

### 기능 추가 시나리오 (삭제 시나리오의 대칭 검증 — 2차 리뷰 실측)

| 시나리오                                   | 신규                                                              | 수정                                                                             | 합계 | 하위 레이어 영향                                  |
| ------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- | ------------------------------------------------- |
| A. 카드 행위 1종 추가 (예: 비교하기 토글)  | `entities/compare`(store+index), `features/toggle-compare/ui` = 3 | `widgets/product-card-actions` 1줄, `widgets/header` 카운트 = 2                  | 5    | `shared`·`entities/product`·`_pages`·`app` 모두 0 |
| B. 페이지 전용 기능 (예: 가격대 필터)      | 0                                                                 | `_pages/products/lib/search-params.ts`, `ui/product-filters.tsx`, mock route = 3 | 3    | 다른 레이어 전부 0                                |
| C. 새 페이지 + 서버 데이터 (예: 상품 상세) | app 라우팅 2 + `_pages/product-detail`(ui·api·index) 4 = 6        | mock route 1 (+결정표 2번 승격 발동 시 3)                                        | 7~10 | `entities/product` 0 (승격 시 +2)                 |

시나리오 A를 현재 구조와 비교하면 파일 수는 3→5로 오히려 늘어난다(§6에서 인정한 비용). 차이는 개수가 아니라 성격이다: 현재 구조의 3파일 중 2개는 **다른 기능과 공유하는 파일**(두 기능이 동거하는 product-actions 등)이지만, 새 구조의 5파일은 신규 3 + 조합 지점 1줄 편집 2로 **기능과 무관한 파일 터치가 0**이다.

## 8. FSD 이해 확인 질문

1. **`ProductCard`가 찜 버튼을 직접 import하면?** — entities(하위)가 features(상위)를 아는 역방향 의존 위반이다. 표현과 행위를 함께 보여줘야 한다면 카드는 `actions` 슬롯만 열고, widget(`product-card-actions`) 또는 page에서 조합한다.
2. **한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가?** — 아니다. feature의 기준은 "재사용되는 사용자 가치 행위"다. 이 프로젝트의 검색·필터는 상품 목록 페이지 전용이라 `_pages/products`가 소유한다. 반면 찜/담기는 홈·목록 두 곳에서 쓰여 feature로 분리했다.
3. **`formatPrice`는 항상 `shared/lib`인가?** — 현재는 `toLocaleString()` 인라인이라 해당 없음. 만든다면 순수 숫자 포맷팅은 shared/lib이지만, 통화 정책·회원 등급 할인·상품별 표시 규칙이 들어가는 순간 도메인 지식이 생기므로 entities(예: `entities/product/lib`)로 소유자를 옮겨야 한다. shared 판별 기준은 사용 빈도가 아니라 도메인 지식 유무다.
4. **두 feature의 협력은 어디서?** — `toggle-cart`와 `toggle-wishlist`는 서로 import하지 않는다. 상위 레이어인 `widgets/product-card-actions`가 둘을 조합하고, 공통 UI(`ToggleButton`)는 아래 레이어 `shared/ui`로 내려 공유한다.
5. **TanStack Query와 Zustand를 서로 복사하지 않은 이유는?** — 두 상태의 SoT가 다르기 때문이다. 서버 데이터의 진실은 서버(캐시는 그 사본 관리자)이고, 선택 상태의 진실은 클라이언트다. 복사하면 무효화·refetch 시점마다 동기화 버그가 생긴다. store에는 `productId`만 저장하고 상품 정보는 항상 쿼리 캐시에서 읽는다.
6. **barrel과 Public API의 차이, 나의 선택은?** — barrel은 경로 축약용 습관적 재수출이고 Public API는 은닉 의도를 가진 계약이다. 나는 선별 생성(§4.3 리트머스 3문항)을 택해 entities·_pages에만 index를 만들었고, 파일 1개짜리 feature/widget에는 만들지 않았다. 어디에 만들지 않았는지도 결정의 일부다.

## 9. AI 활용 표기

- 조사(현재 구조 파악·import 관계 추적·동작 기준선 검증)와 이 문서의 초안 정리는 Claude와 함께 진행했다.
- §2.6 결정표의 최종 결정과 기준, §4.3 Public API 전략(선별 생성), 쿼리 소유자 결정(페이지 소유 + 승격 조건)은 후보 비교 후 직접 내린 결정이다.
- AI가 제안한 것 중 **수용**: 세그먼트 `model`→`api` 정정, `MockApiScenario`의 mock 폴더 격리, `createSelectionStore`의 shared/lib 배치 근거(도메인 무지 기준). **반려/보류**: 전 슬라이스 index.ts 통일안(초기에 고려했으나 barrel과 계약의 구분 기준에 따라 선별 생성으로 변경).

### architecture-review 스킬 1차 리뷰 (RFC 초판) 반영 기록

**수용**

1. mock↔`_pages` 결합("레이어 밖 선언과 Public API 의존의 모순") → §2.8을 2단 경계로 재설계: 봉투 타입은 mock 자체 정의(의도적 중복), 도메인 타입만 entities에서 type-only. `_pages` index의 타입 공개도 제거(§4.1)
2. "하네스가 마지막 Phase"라는 자기모순 → Phase 1로 이동, 규칙을 §2.9에 명문화
3. `ProductListQuery`와 nuqs 파서의 계약 중복 → 결정표 8행: 파서 파생으로 단일화(URL=SoT 일관)
4. `widgets/product-card-actions` 생성 근거 미기록 → 결정표 9행 추가

**반려**

1. 대안 A(상품 목록 DTO·queryOptions를 `entities/product/api`로 선승격) — 소비처 1곳인 쿼리를 미래 예측으로 승격하는 것은 결정표 2번에서 기각한 논리와 같고, A의 최대 이득(mock 결합 해소)은 B로 달성된다
2. 승격 조건 문구 삭제 — 유지. B 채택으로 승격이 프론트 내부 리팩터로 한정되어 부채가 아니라 YAGNI 기록이 됨(결정표 2번에 명시)
3. alias 분리(`@shared/*` 등) — tsconfig·vitest 이중 관리 비용 대비 §2.9 하네스로 충분
4. `fetchCommerceApi` 리네이밍 — 함수 본문의 도메인 무지(배치 기준)는 사실이고, 이름의 "commerce"는 붙는 대상 서버에 대한 서술이지 로직 결합이 아니므로 변경 실익이 낮아 유지
5. §7에 기능 추가 시나리오 추가 — 과제 요구 범위(삭제·뱃지)를 넘는 확장으로 판단해 제외 _(2차 리뷰에서 실측 데이터가 제시되어 철회 — 수용으로 전환)_

### architecture-review 스킬 2차 리뷰 (RFC 갱신본) 반영 기록

**수용**

1. 하네스가 정작 Public API 계약(§4.3)을 강제하지 않는 역전 → §2.9 규칙 4 추가: `@/entities/*/*`·`@/_pages/*/*` 딥 임포트 금지 + 슬라이스 레이어에서 `../../*` 상대경로 우회 차단. 검증 위반 시나리오도 2종→4종 확대
2. `actions` optional의 침묵 버그(주입 누락이 typecheck·build를 통과하며 버튼만 사라짐) → §4.2 **required**로 변경. 행위 없는 카드가 실제로 필요해지면 그때 완화 — 근거가 생긴 뒤의 완화
3. §2.4 의존 방향 규칙의 적용 한계(JS import 한정, 전역 CSS 클래스는 사각지대) 명시
4. `src/app/**` 무규칙 전제와 flat config의 rule options 교체(비병합) 주의를 §2.9에 명시
5. 같은 레이어 차단의 탈출구는 `@x` cross-import이며 규칙 완화가 아님을 판례로 기록(§2.9)
6. 결정표 8행 문구 정정("검증한다"→"Phase 5에서 도입한다") — `satisfies`는 현재 mock 라우트에만 존재함을 실측 확인
7. 결정표 2번에 승격 이동 비용 실측치(3파일) 기입 — 승격 조건이 부채가 아닌 YAGNI 기록임을 수치로 뒷받침
8. §7에 기능 추가 시나리오 3종 표 추가(1차 리뷰 반려 5번 **철회** — 실측치와 "무관 파일 터치 0" 프레이밍으로 작성 비용 대비 가치가 역전됨) + §6 트레이드오프 보강
9. index.ts에 `"use client"`를 붙이지 않는다는 함정 방지 문구(§4.1)

**반려**

1. Playwright smoke 테스트 — "CI 이미 지원"은 조건부 설치 훅(quality.yml)만 있는 상태로, 실제로는 의존성+config+테스트 작성의 새 인프라 구축이다. 과제 범위 밖이므로 반려하고 두 가지로 대체: ① `actions` required가 최대 리스크(버튼 증발)를 컴파일 타임으로 제거 ② 기준선 핵심 3행(토글·이동 간 유지·URL 직접 진입)을 Phase 4 직후에도 수동 재실행(§2.7). 구조 안정화 후 별도 작업으로 재검토

### 하네스 검증 기록 (Phase 1 — §2.9 의도적 위반 재현)

의도적 위반 4종을 임시 파일로 작성해 `pnpm lint`(--max-warnings=0)가 실패하는지 확인하고 원복했다. 4건 모두 `@typescript-eslint/no-restricted-imports`가 의도한 메시지로 차단했고, 원복 후 lint는 다시 통과했다.

| #   | 위반 시나리오                       | 임시 파일                                                                                                  | 결과                                                      |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | entities → features 역방향          | `src/entities/product/__violation-reverse.ts`에서 `@/features/toggle-cart/ui/cart-button` import           | ❌ "entities에서 같은/상위 레이어를 import할 수 없습니다" |
| 2   | 같은 레이어 슬라이스 간 직접 import | `src/features/toggle-cart/__violation-cross.ts`에서 `@/features/toggle-wishlist/ui/wishlist-button` import | ❌ "features에서 같은/상위 레이어를 import할 수 없습니다" |
| 3   | Public API 우회 딥 임포트           | `src/widgets/header/__violation-deep.ts`에서 `@/entities/product/ui/product-card` import                   | ❌ "Public API(슬라이스 루트)로만 import하세요"           |
| 4   | `../../` 상대경로로 슬라이스 탈출   | `src/entities/product/__violation-relative.ts`에서 `../../shared/api/commerce-client` import               | ❌ "상대경로로 슬라이스 경계를 넘을 수 없습니다"          |

구현 노트: 아직 존재하지 않는 레이어 폴더(entities·features·widgets)에 대한 규칙도 즉시 작동함을 확인 — 이 규칙은 모듈 해석이 아니라 import 문자열 패턴 기반이기 때문(§2.9 "Phase 1 도입, 폴더 생성 즉시 작동" 전제 실증). mock 존에는 §2.9 규칙 3에 더해 딥 임포트 차단(규칙 4)도 함께 적용했다 — entities 루트는 타입 한정 허용, 세그먼트 딥 임포트는 타입이라도 차단.

### 마이그레이션 중 발견·보강 기록 (Phase 2~6)

1. **mock 계약 역수입 → 하네스 갭 보강 (Phase 5)** — `_pages/home/api`가 `HomeResponse`를 자기 슬라이스에 정의하는 대신 `@/app/api/_contract`에서 역수입하는 실수가 나왔다(§2.8의 2단 경계가 정반대로 뚫린 형태). 이때 lint가 침묵한 이유는 `@/app/*`이 어떤 금지 패턴에도 없었기 때문 — FSD 레이어 목록에 app이 빠져 있었다. 규칙 1에 "모든 FSD 레이어 → `@/app/*` 금지"를 보강했고, 이후 같은 실수는 lint가 차단한다. 규칙의 구멍은 설계 시점이 아니라 실전 위반이 알려준다는 사례.
2. **`actions` required의 실증 (Phase 2)** — 카드 이동 시 소비처 2곳이 `actions` 주입 없이 호출되는 상태가 나왔고, required 설계 덕에 typecheck가 즉시 실패했다. optional이었다면 찜/담기 버튼이 조용히 사라진 채 build까지 통과했을 것 — 2차 리뷰 수용 2번이 방어한 정확히 그 시나리오.
3. **`"use client"` 소실 (Phase 3)** — `product-actions.tsx`를 3파일로 분해하는 과정에서 원본 1행의 지시어가 새 파일 전부에서 누락됐다. 소비처가 전부 클라이언트 트리라 우연히 동작하는 상태였고 리뷰에서 복원했다. "이동 시 지시어 보존"을 기계가 못 잡는 항목으로 인지 — 분해 이동의 체크리스트 항목으로 남긴다.
4. **숨김 탭의 타이머 동결 (Phase 6)** — 브라우저 탭이 숨겨진 상태에서는 재시도 백오프가 진행되지 않아 에러 상태 도달을 관찰할 수 없었다(§5.3 재현 결과의 환경 특이사항).
