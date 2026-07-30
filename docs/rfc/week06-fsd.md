# RFC: 커머스 FSD 아키텍처 전환

> FSD 구조로 리팩토링한다.
> 스펙: `specs/260729-week-06-fsd-refactoring.spec.md`

## R: 요구사항

### 보존할 동작

리팩토링은 폴더 이동이지 기능 변경이 아니다. 파일을 옮기기 전에 아래 동작을 실제 화면에서 전부 확인했고, 옮긴 후에도 그대로 성립해야 한다.

> 에러 동작은 여기에 없다. 이번 전환에서 재설계하며, 목표 동작은 O(최적화) 절에 있다.

**홈**

- 홈에 들어오면 배너, 카테고리 5종, 인기 상품 6개, 신상품 6개가 보인다.
- 불러오는 동안 "홈을 불러오는 중입니다…" 안내가 보인다.
- 보여줄 상품이 없으면 인기 상품과 신상품 자리에 "표시할 상품이 없습니다."가 보이고, 배너와 카테고리는 유지된다.

**상품 목록**

- `/products`에 들어오면 목록(총 개수, 페이지 표시)과 검색, 카테고리, 정렬 필터가 보인다.
- 검색어를 제출하거나 카테고리, 정렬을 바꾸면 목록이 갱신되고 페이지는 1로 돌아간다. 다른 조건은 유지된다.
- 이전/다음으로 페이지를 넘기고, "2 / 3" 형태로 현재 위치가 보인다.
- 결과가 없으면 "총 0개"와 "조건에 맞는 상품이 없습니다."가 보인다.
- 불러오는 동안 로딩 안내가 보인다.

**URL과 조건 공유**

- 조건이 걸린 URL을 열면 같은 필터 값과 같은 목록이 보인다.
- 새로고침해도 조건과 목록이 유지된다.
- 뒤로/앞으로 가기로 직전 조건과 목록이 복원된다.

**장바구니와 위시리스트**

- 찜/담기를 누르면 버튼 상태와 헤더 개수가 바로 바뀐다.
- 홈에서 바꾼 상태는 목록에도, 목록에서 바꾼 상태는 홈에도 보인다.
- 페이지 이동과 새로고침 후에도 상태와 개수가 유지된다.

**품질 게이트**

- `pnpm check`(테스트 156개, lint, typecheck, build) 통과.

**비기능 보존**

- 찜/담기 저장값의 검증, version, migration 동작이 유지된다. 기존 사용자의 localStorage 데이터가 그대로 복원된다.
- hydration 불일치 경고 없이 첫 화면이 그려진다.
- 서버는 요청마다 새 QueryClient를 만들어 사용자 간 캐시가 섞이지 않는다.
- 서버 prefetch 후 클라이언트가 같은 데이터를 중복 요청하지 않는다.

### 이번 주에 하지 않을 것과 그 이유

- **기능 추가와 UI 변경.** 발견한 버그는 구조 변경과 분리된 커밋으로 수정하고 재현 방법, 원인, 수정 위치, 검증 결과를 기록한다. 에러 경계 재설계만 예외.
- **mock 백엔드(`src/app/api`) 전환.** 백엔드를 흉내 내는 스타터 자산이라 프론트 구조인 FSD의 대상이 아니다. 경계는 A 절에서.
- **지난 주차 학습 자산 전환.** `app/demos`와 `examples`는 학습 이력이다. `shared/ui`(dialog, select, useControlledState)는 이미 맞는 위치다.
- **발생할 수 없는 실패의 처리 코드.** 로그인이 없어 401, 403이 존재하지 않는다. 표에는 "해당 없음"으로 기록한다.
- **변경 반경 실험(Advanced B).** 기본 과제 완성 후 따로 결정한다.

## A: 아키텍처

### 현재 구조에서 실제로 겪는 문제

1. **찜, 담기 버튼을 고치면 카드가 있는 모든 화면을 다시 확인해야 한다.** `ProductCard`가 두 버튼을 직접 import해서, 버튼 변경이 홈 두 섹션과 목록까지 번진다. 버튼 없는 카드로 재사용할 수도 없다.
2. **shared를 고칠 때 장바구니 걱정을 해야 한다.** `shared/store.ts`가 cart, wishlist slice를 조합하고 있어, 도메인과 무관해야 할 폴더에 비즈니스 상태가 산다.
3. **"상품의 URL 기반 상태 관리는 어디 있죠?"에 폴더로 답할 수 없다.** `features/products`에 여러 화면이 쓰는 것(카드), 목록 전용(필터, URL 파서), 홈 전용(HomeContent)이 섞여 있어 수정과 삭제 범위를 폴더 단위로 예측할 수 없다.
4. **타입 하나를 고치면 12개 파일이 영향권이다.** `types/commerce.ts`에 도메인 타입과 mock 전용 타입이 모여 있어 소유자가 없다.
5. **헤더에 메뉴 하나를 추가하려면 두 파일을 고쳐야 한다.** 같은 마크업이 홈과 목록 page.tsx에 복사돼 있다.

### 현재/목표 폴더 트리와 사용할 레이어만 선택한 근거

**현재**

```text
src/
├── app/               라우팅, providers, demos, api(mock)
├── features/
│   ├── products/      카드, 쿼리, 상수, 홈 콘텐츠, 목록, 필터, URL 파서 혼재
│   ├── cart/          slice, 토글, 카운트
│   └── wishlist/      slice, 토글, 카운트
├── shared/            api-client, get-query-client, store 조합 + persist, ui
├── types/commerce.ts  통짜 도메인 타입
└── examples/          참고 예제
```

**목표**

```text
src/
├── app/                       Next 라우팅
│   ├── layout.tsx             전역 스타일, providers
│   ├── providers.tsx          QueryClient, NuqsAdapter, store 복원
│   ├── (commerce)/            커머스 라우트 그룹
│   │   ├── layout.tsx         공통 헤더
│   │   ├── error.tsx          렌더링 오류 경계 (신규)
│   │   ├── page.tsx           홈 진입점
│   │   └── products/page.tsx  목록 진입점
│   ├── api/                   mock 백엔드 (범위 밖)
│   └── demos/                 4주차 데모 (범위 밖)
├── _pages/                    페이지 조합
│   ├── home/                  ui: HomeContent
│   └── products/              ui: ProductList
├── features/                  사용자 기능
│   ├── product/               ui: 검색 폼, 필터 / model: URL 파서, 훅, 상수
│   ├── cart/                  ui: 담기 토글, 카운트
│   └── wishlist/              ui: 찜 토글, 카운트
├── entities/                  도메인 개념
│   ├── product/               ui: 카드 / api: 쿼리 / model: 타입
│   ├── cart/                  model: slice / @x
│   ├── wishlist/              model: slice / @x
│   └── client-state/          model: store 조합 + persist
└── shared/                    도메인 무관 기반
    ├── api-client.ts, get-query-client.ts
    └── ui/                    dialog, select (4주차 자산)
```

**레이어 선택 근거**

- **widgets 없음.** 공유 조합은 헤더와 카드 조합 둘뿐이다. 헤더는 layout이 흡수하고, 카드 조합 몇 줄은 두 페이지의 중복으로 수용한다. 공유가 더 생기면 그때 도입한다(pages first).
- **헤더는 `(commerce)` 그룹 layout에.** 루트 layout은 `/demos`까지 감싸서 데모 화면에 커머스 헤더가 생긴다. URL에 영향 없는 route group으로 격리한다.
- **pages 레이어 이름은 `_pages`.** `src/pages`는 Pages Router로 오인된다. FSD 공식 Next.js 가이드의 표기이고 공식 린터와 호환된다. `views`는 커뮤니티 관행이라 비선택.
- **`_app` 없음.** app 레이어의 실체(providers, layout, 전역 스타일)는 Next 예약 파일이라 `src/app`에 있어야 한다. store 조합을 `_app`에 두는 안은 구독자가 features라 역방향이 되어 탈락(결정표 참고). route 파일은 얇은 진입점으로 유지하고, 아무도 `src/app`에서 import하지 않는다.
- **`_pages`는 조합 전용.** 상태와 파서는 feature에 두고, 페이지 슬라이스에는 조합 컴포넌트만 남긴다.
- **features 명명**: 기능이 다루는 도메인 대상 이름으로 짓는다(product, cart, wishlist). 행위가 늘어 폴더가 커지면 그때 행위 단위로 쪼갠다.
- `processes`는 v2.1에서 deprecated. 빈 폴더와 미사용 index.ts는 만들지 않는다.
- **mock 경계**: `src/app/api`는 네트워크 건너편으로 취급한다. 프론트는 HTTP 호출로만 통신하고 mock 코드를 import하지 않는다. mock 전용 타입은 mock이 소유한다.

### 의존 규칙과 허용/금지 import 예시

```text
app → _pages → features → entities → shared
```

1. 자기보다 아래 레이어만 import한다.
2. 같은 레이어의 다른 슬라이스를 직접 import하지 않는다. 예외는 entities의 `@x` 공인 통로(무엇을 누구에게 내주는지 파일로 명시, FSD v2.1 표준)뿐이다.
3. 다른 슬라이스는 루트 진입점(index.ts, 서버 전용은 index.server.ts)으로만 import한다. 같은 슬라이스 안은 상대 경로(자기 index 참조는 순환). shared는 슬라이스가 아니라 파일 경로로 직접 import한다.

```ts
// 허용
import { ProductCard } from '@/entities/product';                    // 상위가 하위를 사용
import { createCartSlice } from '@/entities/cart/@x/client-state';   // entity 간 공인 통로
import { apiClient } from '@/shared/api-client';                     // shared는 파일 경로 직접 import

// 금지
import { CartToggleButton } from '@/features/cart';        // entities/product 안에서: 하위가 상위
import { useProductListUrlState }
  from '@/features/product';                               // features/cart 안에서: 같은 레이어
import { productQueries } from '@/entities/product/api/queries'; // 딥 import
```

ESLint(`eslint-plugin-import-x`의 `no-restricted-paths`)로 강제한다. 마이그레이션 중에는 warn, 이동 완료 후 error로 승격한다.

_하네스 위반 재현과 통과 증거: 구현 후 기록_

### 파일 매핑표 (이동하는 파일 + 남기는 파일)

| 현재 위치 | 목표 위치 | 레이어 / 슬라이스 / 세그먼트 | 이동 또는 유지하는 이유 |
| --- | --- | --- | --- |
| `features/products/ProductCard.tsx` | `entities/product/ui/ProductCard.tsx` | entities / product / ui | 홈과 목록이 재사용하는 상품 표현. 버튼 직접 import를 actions 주입으로 바꿔 행위 변경이 카드에 번지지 않게 한다 |
| `features/products/api.ts` | `entities/product/api/fetch-product.ts` | entities / product / api | queryOptions가 쓰는 HTTP 호출. 같은 세그먼트에 두고 슬라이스 밖에 노출하지 않는다 |
| `features/products/queries.ts`(+test) | `entities/product/api/queries.ts` | entities / product / api | 홈과 목록의 queryOptions 팩토리. 캐시 키 네임스페이스와 staleTime 정책을 한 곳에서 관리한다 |
| `types/commerce.ts`의 Product, Category(CATEGORY_IDS), ProductSort(PRODUCT_SORTS) | `entities/product/model/types.ts` | entities / product / model | 상품이 무엇인가에 대한 도메인 개념의 정의 |
| `types/commerce.ts`의 ProductListQuery, ProductListResponse, HomeResponse | `entities/product/api/` 내 타입 | entities / product / api | 조회 요청과 응답의 계약. 조회 정의(fetch, queryOptions) 옆에 둬 model이 다시 타입 창고가 되는 것을 막는다 |
| `types/commerce.ts`의 MockApiScenario, ApiErrorResponse | `app/api/_data/` 내부 | app(mock) | 시나리오 제어값과 에러 응답 형태는 mock의 계약이다. 프론트는 모른다 |
| `features/products/constants.ts` | `features/product/model/constants.ts` | features / product / model | 필터 옵션, 라벨, 페이지 크기는 검색 UI와 URL 파서만 쓴다 |
| `features/products/search-params.ts`(+test) | `features/product/model/search-params.ts` | features / product / model | 목록 URL 스키마를 아는 유일한 코드. 조건 변경 시 page 리셋 규칙 포함 |
| `features/products/product-list-params.ts`(+test) | `features/product/model/product-list-params.ts` | features / product / model | URL 정규화 파서와 도메인 쿼리 변환. URL을 아는 쪽이 변환까지 책임진다 |
| `features/products/ProductSearchForm.tsx` | `features/product/ui/ProductSearchForm.tsx` | features / product / ui | 검색어 입력과 제출 UI. 입력 중은 로컬, 제출 값만 URL로 보낸다 |
| `features/products/ProductListFilters.tsx` | `features/product/ui/ProductListFilters.tsx` | features / product / ui | 카테고리, 정렬 선택 UI. 필터 상수와 URL 훅을 같은 슬라이스에서 쓴다 |
| `features/products/HomeContent.tsx` | `_pages/home/ui/HomeContent.tsx` | _pages / home / ui | 홈 전용 화면 구성. 섹션 순서와 카드에 붙일 행위 버튼을 결정한다 |
| `features/products/ProductList.tsx` | `_pages/products/ui/ProductList.tsx` | _pages / products / ui | 목록 전용 화면 구성. 목록, 페이지네이션, 카드 조합 |
| `features/cart/cart-slice.ts` | `entities/cart/model/cart-slice.ts` | entities / cart / model | 장바구니 상태 형태와 토글 규칙. 도메인의 데이터 모델 |
| `features/wishlist/wishlist-slice.ts` | `entities/wishlist/model/wishlist-slice.ts` | entities / wishlist / model | 위와 동일 |
| `shared/store.ts` | `entities/client-state/model/store.ts` | entities / client-state / model | slice 조합과 persist. 비즈니스 상태를 shared에서 뺀다. 저장 키가 그대로라 사용자 데이터 이전이 없다 |
| `shared/store.test.tsx`, `shared/store-restore.test.tsx` | 순수 store 검증은 `entities/client-state/model/`, 컴포넌트 결합 검증은 루트 `tests/` | entities, 레이어 밖 | 기존 테스트가 feature 컴포넌트(CartCount 등)를 렌더하므로 entities에 그대로 두면 하위가 상위를 import하게 된다. 레이어를 가로지르는 통합 테스트는 레이어 밖 루트 `tests/`에 둔다(단위는 co-location, 통합은 루트 디렉터리라는 일반 관행. src 리팩토링이 이 테스트를 강제로 바꾸지 않게 하는 목적도 있다) |
| `features/cart/CartToggleButton.tsx` | `features/cart/ui/CartToggleButton.tsx` | features / cart / ui | 담기 행위 UI. client-state 구독은 하위 방향이라 합법 |
| `features/cart/CartCount.tsx` | `features/cart/ui/CartCount.tsx` | features / cart / ui | 담긴 개수 표시. 행위와 한 슬라이스에 응집. entities에 두면 entity 간 결합이 늘어 비선택 |
| `features/wishlist/WishlistToggleButton.tsx`, `WishlistCount.tsx` | `features/wishlist/ui/` | features / wishlist / ui | 위와 동일 |
| `app/(home)/page.tsx`, `app/products/page.tsx` | `app/(commerce)/page.tsx`, `app/(commerce)/products/page.tsx` | app | 헤더 마크업과 화면 구성을 덜어내고 서버 prefetch + 페이지 컴포넌트 렌더만 남긴다 |
| (신규) | `app/(commerce)/layout.tsx` | app | 커머스 공통 헤더. 루트에 두면 `/demos`에도 생기므로 그룹으로 격리 |
| `app/layout.tsx` | 유지 | app | 전역 스타일과 providers만. 헤더는 두지 않는다 |
| `app/providers.tsx` | 유지 | app | 앱 초기화는 app 레이어의 본래 책임 |
| `shared/api-client.ts`(+test), `shared/get-query-client.ts` | 유지 | shared | 도메인을 모르는 기반 코드. 도메인 타입 의존 없음 확인 |
| `shared/ui/dialog`, `shared/ui/select`, `shared/ui/useControlledState.ts`(+test) | 유지 | shared / ui | 이미 맞는 위치. import 경로까지 현행 유지 |
| `app/api/**`, `app/demos/**`, `examples/**` | 유지 | 범위 밖 | 근거는 R의 "하지 않을 것" |
| `app/globals.css`, `app/home.css` | 유지 | app | layout이 import하는 전역 스타일. home.css는 실제로는 홈, 목록 공용이라 이름에 오해 소지(수정 보류, 파편화 기록 대상) |

### 애매한 파일 결정표

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
| --- | --- | --- | --- | --- |
| `ProductCard` | `entities/product/ui` (actions 주입) | 각 `_pages`의 로컬 카드 (사본) | **A** | 사본은 카드 수정마다 두 곳을 고치게 된다. actions 주입이면 entity로 내려도 방향 위반이 없다. 조합 몇 줄의 중복만 수용 |
| 상품 queryOptions | `entities/product/api` | 각 페이지 슬라이스의 `api` | **A** | home()과 list()는 페이지가 다르지만 같은 도메인의 서버 상태다. 나누면 캐시 키 네임스페이스와 staleTime 정책이 흩어진다. 홈 응답의 배너는 mock 응답 계약의 산물이고 조회 정의의 소유자는 도메인 |
| 장바구니 store | `entities/cart/model` | 담기 feature의 `model` (제3후보: `_app`의 store) | **slice는 entities/cart, 조합과 persist는 entities/client-state, `@x` 연결** | 담기, 찜, 헤더 카운트가 공유한다(기준: 함께 쓰는 기능 수). 단일 store 방침(Zustand 공식 권장)과 persist 키 유지를 함께 만족. feature model은 다른 기능이 내부를 구독하게 되어 탈락, `_app` store는 구독자가 features라 역방향이라 탈락. client-state는 기술적 슬라이스임을 인정하는 예외 |
| `types/commerce.ts`의 `Product` 타입 | `entities/product/model` | `shared/types` 유지 | **A** | 한 창고는 소유자를 지우고 무관한 코드를 결합시킨다. mock 전용 타입은 mock으로 보낸다 |
| 목록 URL 파서와 훅 | `_pages/products/model` | `features/product/model` | **B** | 검색, 필터, 정렬은 상품이 무엇인가(entity)가 아니라 사용자가 목록에 가하는 행위라 feature 자격이 있다. 페이지 슬라이스는 조합 전용이라는 규칙에 따라 한 페이지 전용이어도 feature에 두고, 도메인 대상별로 행위를 모은다. pages first(페이지에 두다 재사용 시 승격)와 다른 의도적 선택임을 기록 |

### 단계별 마이그레이션 계획과 검증 방법

공통 검증은 `pnpm check`(테스트 156개 포함).

| 단계 | 작업 | 추가 검증 |
| --- | --- | --- |
| 0 | 하네스(ESLint 의존 규칙, warn)와 architecture-review SKILL 작성 | 위반 코드를 일부러 넣어 규칙이 잡는지 확인(재현 증거 기록) |
| 1 | 타입 분해: `types/commerce.ts`를 entities/product의 model과 api, mock으로 나누고 참조 12개 파일 경로 갱신 | typecheck |
| 2 | `entities/product` 신설: api, queries 이동 | queries 테스트 |
| 3 | store 재배치: slice는 entities/cart, wishlist로, 조합과 persist는 client-state로, `@x` 신설, 도메인별 selector 훅 공개 | store 테스트, localStorage 키와 기존 저장값 복원 확인 |
| 4 | `features/product` 신설: 검색 폼, 필터, URL 모델, 상수 이동, `index.server.ts` 분리 | search-params, product-list-params 테스트 |
| 5 | `_pages` 신설, ProductCard actions 전환, `(commerce)` 그룹과 헤더 layout 이동, page.tsx 축소 | 기준선 브라우저 확인(R 전 항목), `/demos`에 헤더 없음, hydration 경고 없음, 초기 중복 요청 없음 확인 |
| 6 | features 정리(ui 세그먼트, index.ts), Public API 정리, 딥 import 제거, 테스트 분리 배치 | 하네스 위반 0 확인 후 error 승격, 통과 증거 기록 |
| 7 | architecture-review SKILL로 구조 점검, 지적의 수용과 반려를 근거와 함께 기록 | |

에러 경계 구현(O 절)은 구조 이동과 커밋을 분리해 마이그레이션 완료 후 진행한다.

## D: 상태 분류표

각 상태의 원본과 소유자를 이동 전에 못박아, 옮기는 과정에서 상태 복제가 생기는 것을 막는다.

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 이동 후에도 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과 | 서버/TanStack Query | entities/product (api) | 홈, 상품 목록 | queryOptions로만 조회. 캐시가 유일한 사본 |
| 검색, 정렬, 페이지 | URL/nuqs | features/product (model) | 상품 목록 | URL이 유일 원본. useState 복사 없이 파서로 읽고 setConditions로만 변경 |
| 장바구니, 위시리스트 | Zustand | entities/client-state (slice는 cart, wishlist 소유) | 헤더, 상품 행위 UI | 상품 ID 배열만 저장. 개수 등 파생값은 selector로 계산 |
| Dialog 열림 여부 | React 로컬 상태 | shared/ui/dialog (소비 컴포넌트의 로컬) | 해당 UI | 컴포넌트 수명의 상태를 전역 store로 승격하지 않음 |

## I: 인터페이스

### 슬라이스별 공개 API

숨길 내부가 있는 슬라이스만 루트 index.ts로 선별 수출한다. 경로 축약용 barrel이 아니라 "외부가 알아도 되는 것은 이것뿐"이라는 계약이고, 딥 import 금지 하네스가 강제한다. 공개할 것이 없는 entities/cart, wishlist는 index 없이 `@x` 파일만 둔다.

| 슬라이스 | 공개 (index.ts) | 숨김 |
| --- | --- | --- |
| entities/product | ProductCard, productQueries, 도메인 타입 | fetch 함수. 조회는 queryOptions로만 |
| entities/client-state | 도메인별 selector 훅(useCartCount, useIsInCart, useToggleCart와 wishlist 동형), useRestoreSavedStore | useBoundStore(통합 store 훅), persist 검증 storage, 저장 키 |
| entities/cart, entities/wishlist | index 없음. `@x/client-state`로 slice 생성 함수만 제공 | `@x` 외의 접근 경로 없음 |
| features/product | (index.ts) ProductSearchForm, ProductListFilters, useProductListUrlState, usePageClamp, toProductListQuery / (index.server.ts) loadProductListConditions | 필터 상수와 라벨, 검색어 정규화 |
| features/cart | CartToggleButton, CartCount | (내부 없음) |
| features/wishlist | WishlistToggleButton, WishlistCount | 위와 동일 |
| _pages/home, _pages/products | 페이지 컴포넌트 1개 | 페이지 내부 구성 |
| shared | index 없음. 파일 경로로 직접 import | |

- **통합 store 훅은 공개하지 않는다.** useBoundStore를 그대로 열면 cart 기능이 wishlist 상태를 읽어도 막을 수 없다. 상태 조각별 selector 훅만 공개해 경계를 좁힌다. store 대신 커스텀 훅만 export하는 Zustand 권장 패턴이고, 훅의 소유자가 store를 가진 client-state라 entity 간 참조도 늘지 않는다.
- **features/product는 진입점을 둘로 나눈다.** `loadProductListConditions`는 `nuqs/server`(서버 전용 모듈)를 쓰는데, 클라이언트 컴포넌트와 같은 index.ts로 수출하면 클라이언트 번들의 모듈 그래프에 서버 전용 코드가 끌려 들어간다. 서버 전용 수출은 `index.server.ts`로 분리한다.

### `ProductCard`와 행위의 조합

카드는 행위를 모르고, 조합은 페이지 슬라이스의 책임이다. `entities → features` 역방향 import는 없다(의존 규칙 1). 행위 없는 화면은 actions를 생략하면 된다.

```tsx
// entities/product/ui/ProductCard.tsx : actions 슬롯만 제공
export function ProductCard({ product, headingLevel, actions }: {
  product: Product;
  headingLevel: 'h2' | 'h3';
  actions?: React.ReactNode;
});

// _pages/home, _pages/products : 조합
<ProductCard
  product={product}
  headingLevel="h3"
  actions={
    <>
      <WishlistToggleButton productId={product.id} productName={product.name} />
      <CartToggleButton productId={product.id} productName={product.name} />
    </>
  }
/>
```

## O: 최적화

### 캐시 정책 유지 근거

staleTime(홈 5분, 목록 1분), retry(서버 0회, 브라우저 2회), 페이지 전환 placeholderData는 5주차에 근거와 함께 정한 값이다. 폴더 이동은 데이터 신선도 요구를 바꾸지 않으므로 전부 유지한다.

### 에러 처리 표와 전파 기준

**목표 동작** (전환 후의 에러 UX. R의 보존 목록과 별개로 이번 주에 구현한다)

- 홈: 보여줄 것이 없는 실패는 콘텐츠 영역을 채우는 에러 화면(안내 + 다시 시도). 보던 화면의 재조회 실패는 화면을 유지하고 갱신 실패 안내와 다시 시도 버튼을 보인다.
- 목록: 보여줄 목록이 없는 실패는 목록 영역을 채우는 에러 화면(안내 + 다시 시도 + 홈으로 가기), 헤더와 검색, 필터는 유지. 보여줄 목록이 있는 배경 재조회 실패는 목록을 유지하고 안내와 다시 시도 버튼을 보인다.
- 두 경우 모두 다시 시도는 페이지 새로고침 없이 다시 불러온다.

**조회 실패는 경계로 보내지 않는다. `app/(commerce)/error.tsx`는 예상 밖 렌더링 오류 전담이다.** 조회 실패는 예상 가능한 실패라서, 실패와 무관한 UI(헤더, 검색, 필터)를 남긴 채 그 자리에서 새로고침 없이 재시도할 수 있어야 한다. `throwOnError: false`를 queryOptions에 명시해 이 결정을 코드에 남긴다.

- 인라인 처리는 "보여줄 데이터가 남아 있는가"로 나눈다(Suspense 훅 기본값의 철학). 없으면 콘텐츠 영역을 채우는 에러 화면, 있으면 화면 유지 + 상단 지속형 배너. 재시도가 필요한 안내에 자동으로 사라지는 토스트는 부적합하다(NN/g).
- 경계 전파 조건으로 흔한 `query.state.data === undefined`는 페이지 넘김 실패에서 placeholderData를 보지 못해 목록 전체를 경계로 보낸다. 실패를 값(isError)으로 받아야 영역 단위 처리가 가능하다.
- 컴포넌트의 상태 체크는 data 우선으로 바꾼다. 지금의 isError 우선은 배경 갱신 실패가 멀쩡한 화면을 에러 안내로 덮는 안티패턴이다(TanStack Query 메인테이너 가이드).
- useSuspenseQuery로 바꾸지 않는다. placeholderData가 없어 페이지네이션의 이전 목록 유지가 깨진다.

| 실패 유형 | 처리 위치 | Error Boundary로 전파하는가 | 사용자 UI | 재시도 방법 | 이 경계를 선택한 이유 |
| --- | --- | --- | --- | --- | --- |
| 상품 조회 실패(홈, 목록), 보여줄 데이터 없음 | 콘텐츠 영역 인라인 | 아니오 | 영역을 채우는 에러 화면(다시 시도, 목록은 홈으로 가기 포함). 헤더와 필터 유지 | 에러 화면의 다시 시도(refetch) | 실패와 무관한 UI를 남겨 다른 행동(조건 변경, 홈 이동)이 가능하게 하고, 빈 본문만 에러 화면이 채운다 |
| 상품 조회 실패, 보여줄 데이터 있음(배경 재조회) | 해당 컴포넌트 인라인 | 아니오 | 화면 유지 + 상단 지속형 배너 | 배너의 다시 시도(refetch, 재시도 중 비활성화) | 사용자가 요청하지 않은 배경 작업의 실패가 보던 화면을 파괴하면 안 된다 |
| 잘못된 검색 조건(4xx) | 해당 없음 | | | | URL 파서가 허용값으로 정규화해 발생 경로가 없다. 서버측 검증이 생기면 인라인 처리 |
| 예상하지 못한 렌더링 오류 | `app/(commerce)/error.tsx` | 예 | 페이지 콘텐츠를 대체하는 에러 화면 + 다시 시도 | `unstable_retry`(reset + router.refresh). reset만으로는 서버 컴포넌트가 다시 렌더되지 않는다 | 예상 밖 오류는 개별 대응이 불가능하므로 복구 UI를 한 곳으로 일원화 |
| 장바구니 행위의 비즈니스 오류 | 해당 없음 | | | | 서버 mutation이 없는 로컬 토글이라 실패 경로가 없다. 서버 장바구니 도입 시 mutation onError로 |

- Error Boundary는 이벤트 핸들러와 비동기 콜백을 잡지 못한다. 현재 해당 경로는 store 토글(동기)과 nuqs setConditions(Promise를 버림)뿐이고, 후자는 실패해도 URL만 안 바뀌므로 별도 처리를 두지 않는다. 서버 mutation이 생기면 onError로 처리한다.
- `error.tsx`는 `(commerce)`에 하나만 둔다. 페이지 2개에 안내가 같고, 헤더는 layout이라 경계가 떠도 유지된다. 감싼 layout과 providers의 오류는 잡지 못하며, `global-error.tsx`는 도입하지 않고 한계로 기록한다.
- mock 제어값 `scenario`는 사용자 URL과 ProductListQuery에 넣지 않는다. 검증용 임시 throw는 검증 후 제거한다.

_구현 후 실패 재현 결과를 여기에 기록한다._

### 로딩 경계

- `loading.tsx`는 쓰지 않는다. 세그먼트 전체를 덮어서, 지금의 섹션 단위 Suspense(필터는 즉시 보이고 목록만 대기)보다 로딩 범위가 거칠다.
- 첫 진입과 새로고침 로딩은 페이지 안 Suspense fallback이, 조건 변경 로딩은 `isPending`과 `isPlaceholderData`가 맡는다.

### 이번 주에 하지 않을 최적화와 이유

서버 prefetch 구조 개편, 캐시 수명 튜닝, 요청 취소(AbortSignal)와 retry 변경, 번들 최적화. 전부 폴더 이동과 무관하다. 이번 주의 목표는 변경 반경이다.

## 삭제 시나리오 자가 검증

_작성 예정(5단계에서). 위시리스트 통째 제거, 신상품 뱃지 추가_
