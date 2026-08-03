# RFC: week06 — FSD로 변경 반경을 설계한다

> 5주차까지 만든 커머스의 동작을 유지하면서, "이 파일은 어디에 두어야 하는가"와 "이 변경은 어디까지 퍼지는가"에 답할 수 있는 구조로 바꾼다.

---

## R — Requirements

### 보존할 기능

- 홈: 배너·카테고리·인기상품·신상품 표시, 로딩·에러·빈 상태
- 상품 목록: 검색·카테고리·정렬·페이지네이션, URL 공유·새로고침·앞뒤 이동
- 장바구니·위시리스트: 홈↔목록 상태 동기화, 헤더 개수, persist
- `pnpm check` 통과

### 이번 주에 하지 않을 것과 이유

| 항목                            | 이유                                              |
| ------------------------------- | ------------------------------------------------- |
| 기능 추가                       | 리팩토링과 기능 변경을 같은 커밋에 섞지 않음      |
| 디자인 변경                     | 리팩토링 중 기능 변경이 섞이면 diff 추적이 어려움 |
| mock 백엔드(Route Handler) 이동 | 프론트엔드 리팩토링 범위에서 제외                 |
| Advanced A (의존성 하네스)      | 기본 과제 완성 후 따로 결정한다                   |
| Advanced B (변경 반경 실험)     | 기본 과제 완성 후 따로 결정한다                   |

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

1. **`types/commerce.ts` 단일 파일에 모든 타입 혼재**
   `Product`, `CartItem`, `HomeResponse` 등 서로 다른 도메인의 타입이 한 파일에 있다. 어떤 타입이 어느 기능의 소유인지 경계가 없어서 의존 관계를 파악하기 어렵다.

2. **`useProductFilters`의 책임 과부하**
   URL 파싱·debounce·React Query 호출·페이지 계산이 한 훅에 혼재한다. 변경 이유가 다른 코드가 한 곳에 있어서 어디까지 영향이 가는지 추적하기 어렵다.

3. **`ProductCard`의 역방향 의존**
   상품을 표시하는 `ProductCard`가 찜·장바구니 store를 직접 import한다. 상품 표현(entity 성격)이 사용자 행위(feature 성격)를 알고 있는 역방향 의존이다.

### 현재/목표 폴더 트리

```
현재:
src/
  app/              ← Next.js 라우팅
  components/       ← ProductCard, Header, ui/
  hooks/            ← useProductFilters
  queries/          ← homeQueries, productsQueries
  service/          ← home.ts, products.ts
  store/            ← cartStore, wishlistStore
  types/            ← commerce.ts
  constants/        ← time.ts

목표:
src/
  app/              ← Next.js 라우팅 (유지, 얇은 진입점)
    layout.tsx      ← root layout: Providers만 (TanStack Query, nuqs 등)
    providers.tsx   ← 전역 Provider 컴포넌트 (유지)
    globals.css     ← 전역 스타일 (유지)
    (commerce)/
      layout.tsx    ← widgets/header import, 공통 헤더
      page.tsx      ← _pages/home/ui import만
      products/
        page.tsx    ← _pages/product-list/ui import만
    api/            ← Route Handler (mock 백엔드, 이동 범위 제외)
  _pages/           ← 페이지 컴포넌트 (app/의 page.tsx가 import)
    home/
      ui/           ← 홈 페이지 컴포넌트
      api/          ← homeQueries, service/home
      model/        ← HomeResponse 타입
    product-list/
      ui/           ← 상품 목록 페이지 컴포넌트
  widgets/          ← 여러 레이어를 조합하는 단위
    product-card/   ← ProductCard(순수) + 찜·담기 버튼 조합
    header/         ← 장바구니·위시리스트 카운트 조합
  features/         ← 사용자 행위 단위 슬라이스
    product-filters/
      ui/           ← 검색 input, 카테고리·정렬 select 폼
      model/        ← useProductFilters
  entities/         ← 도메인 타입·쿼리·store 슬라이스
    product/
      ui/           ← ProductCard (순수 표시, 행위 없음)
      model/        ← Product 타입
      api/          ← productsQueries, service/products
    cart/
      model/        ← CartItem 타입, cartStore
    wishlist/
      model/        ← wishlistStore
  shared/           ← 도메인 없는 공통 코드 (슬라이스 없음)
    constants/
    ui/
```

### entity vs feature 판단 기준

1. **지워도 화면이 살아있나, 죽나?**
   그 코드를 지웠을 때 데이터를 볼 방법 자체가 사라지면 → entity
   그냥 "할 수 있던 행동" 하나만 없어지는 거면 → feature

2. **여러 화면에서 그대로 재사용되는 "기본형"인가?**
   있는 그대로 가져오는 조회(GET)는 → entity
   특정 조건/의도(검색어, 필터, 클릭 등)가 파라미터로 박힌 요청은 → feature

3. **사용자의 의도가 개입하는가?**
   "그냥 보여줘"면 → entity
   "사용자가 선택/입력/클릭한 대로 바뀌어라"면 → feature

### 사용할 레이어와 근거

#### shared

슬라이스 없이 세그먼트로만 구성한다. 비즈니스 도메인을 몰라야 하므로 entities 이상을 import하지 않는다.

| 세그먼트    | 이동할 파일                                              | 이유                         |
| ----------- | -------------------------------------------------------- | ---------------------------- |
| `constants` | `src/constants/time.ts`                                  | 도메인 없는 공통 상수        |
| `ui`        | `src/components/ui/dialog/`, `src/components/ui/select/` | 도메인 없는 공통 UI 컴포넌트 |

#### entities

도메인(명사) 단위로 슬라이스를 나눈다. 상위 레이어(features, \_pages)를 import하지 않는다.

| 슬라이스   | 세그먼트 | 이동할 파일                                                       | 이유                              |
| ---------- | -------- | ----------------------------------------------------------------- | --------------------------------- |
| `product`  | `ui`     | `src/components/ProductCard.tsx` (순수 표시만)                    | 행위 없는 순수 상품 표시 컴포넌트 |
| `product`  | `model`  | `src/types/commerce.ts`의 Product 타입                            | 상품 도메인 타입                  |
| `product`  | `api`    | `src/queries/productsQueries.ts`, `src/service/products.ts`       | 상품 서버 상태                    |
| `cart`     | `model`  | `src/store/cartStore.ts`, `src/types/commerce.ts`의 CartItem 타입 | 장바구니 도메인 상태. 결정표 참고 |
| `wishlist` | `model`  | `src/store/wishlistStore.ts` | 위시리스트 도메인 상태. 결정표 참고 |

#### features
사용자 행위(동사) 단위로 슬라이스를 나눈다. entities를 조합하되 역방향 import는 금지한다.

| 슬라이스 | 세그먼트 | 이동할 파일 | 이유 |
|----------|---------|------------|------|
| `product-filters` | `ui` | `src/app/products/page.tsx`의 필터 폼 (분리 예정) | 검색·카테고리·정렬 조작 UI |
| `product-filters` | `model` | `src/hooks/useProductFilters.ts` | 사용자가 검색·필터·정렬·페이지를 조작하는 행위 |

#### widgets
여러 레이어(entities + features)를 조합하는 단위. 단독으로 동작하는 UI 블록이다.

| 슬라이스 | 이동할 파일 | 이유 |
|----------|------------|------|
| `product-card` | `src/components/ProductCard.tsx` (조합 부분) | entities/product/ui(순수 표시) + features(찜·담기 행위)를 조합. import 방향 규칙상 상위 레이어에서 조합해야 함 |
| `header` | `src/components/Header.tsx` | 장바구니·위시리스트 store를 import해 카운트를 보여줌. 여러 페이지에서 공유하므로 _pages에 둘 수 없음 |

#### _pages
라우트 단위 페이지 슬라이스. `app/`의 `page.tsx`는 얇은 진입점으로 유지하고 실제 페이지 컴포넌트는 여기서 관리한다.

| 슬라이스 | 세그먼트 | 이동할 파일 | 이유 |
|----------|---------|------------|------|
| `home` | `ui` | `src/app/page.tsx` 내용 | 홈 페이지 컴포넌트 |
| `home` | `api` | `src/queries/homeQueries.ts`, `src/service/home.ts` | 홈 페이지에서만 사용하는 데이터 |
| `home` | `model` | `src/types/commerce.ts`의 HomeResponse 타입 | 홈 전용 타입 |
| `product-list` | `ui` | `src/app/products/page.tsx` 내용 | 상품 목록 페이지 컴포넌트 |

#### app
Next.js 라우팅 디렉터리. FSD 레이어가 아니라 Next.js 규칙에 따른 진입점이다. 실제 로직은 두지 않는다.

| 파일 | 역할 | 이유 |
|------|------|------|
| `layout.tsx` | Providers 설정 | 전역 Provider는 루트 레이아웃에서 한 번만 |
| `providers.tsx` | Provider 컴포넌트 | layout.tsx를 얇게 유지하기 위해 분리, app/에 유지 |
| `globals.css` | 전역 스타일 | app/에 유지 |
| `(commerce)/layout.tsx` | 공통 헤더 | widgets/header를 import해 모든 페이지에 렌더링 |
| `(commerce)/page.tsx` | 홈 진입점 | _pages/home/ui import만 |
| `(commerce)/products/page.tsx` | 상품 목록 진입점 | _pages/product-list/ui import만 |
| `api/` | Route Handler | mock 백엔드, 이동 범위 제외 |

### 단계별 마이그레이션 계획

하위 레이어부터 이동한다. 각 단계 완료 후 `pnpm check`로 검증한다.

| 단계 | 작업 | 검증 |
|------|------|------|
| 1 | `shared` 이동 — `constants/time.ts`, `ui/dialog`, `ui/select` | `pnpm check` |
| 2 | `entities` 이동 — Product 타입, productsQueries, cartStore, wishlistStore | `pnpm check` |
| 3 | `features` 이동 — `useProductFilters`, 필터 폼 UI 분리 | `pnpm check` |
| 4 | `widgets` 이동 — `ProductCard` 조합, `Header` | `pnpm check` |
| 5 | `_pages` 이동 — 홈·상품목록 페이지 컴포넌트, homeQueries | `pnpm check` + 수동 검증 |
| 6 | `app` 정리 — `(commerce)` 라우트 그룹, layout 분리 | `pnpm check` + 수동 검증 |

> **Advanced A** — ESLint 규칙(`eslint-plugin-boundaries` 등)으로 import 방향을 자동 검증하는 의존성 하네스는 기본 과제 완성 후 별도 결정한다.

### 허용/금지 import 예시

상위 레이어만 하위 레이어를 import할 수 있다. 역방향과 같은 레이어 슬라이스 간 직접 import는 금지한다.

```
허용 (상위 → 하위):
app/(commerce)/layout       → widgets/header
app/(commerce)/page         → _pages/home/ui
_pages/product-list         → features/product-filters
_pages/product-list         → widgets/product-card
widgets/product-card        → entities/product/ui
widgets/product-card        → entities/cart/model
widgets/product-card        → entities/wishlist/model
widgets/header              → entities/cart/model
widgets/header              → entities/wishlist/model
features/product-filters    → entities/product/api

금지:
entities/product/ui  → entities/cart/model   (같은 레이어 슬라이스 간 직접 import)
entities/product/ui  → features/product-filters  (하위 → 상위, 역방향)
features/product-filters → widgets/product-card  (하위 → 상위, 역방향)
shared               → entities               (shared는 도메인을 몰라야 함)
```

### 파일 매핑표

| 현재 위치 | 목표 위치 | 레이어/슬라이스/세그먼트 | 이동 또는 유지하는 이유 |
|-----------|----------|------------------------|------------------------|
| `src/constants/time.ts` | `src/shared/constants/time.ts` | shared/constants | 도메인 없는 공통 상수 |
| `src/components/ui/dialog/` | `src/shared/ui/dialog/` | shared/ui | 도메인 없는 공통 UI |
| `src/components/ui/select/` | `src/shared/ui/select/` | shared/ui | 도메인 없는 공통 UI |
| `src/types/commerce.ts` (Product 타입) | `src/entities/product/model/` | entities/product/model | 상품 도메인 타입 소유자 명확 |
| `src/types/commerce.ts` (CartItem 타입) | `src/entities/cart/model/` | entities/cart/model | 장바구니 도메인 타입 소유자 명확 |
| `src/types/commerce.ts` (HomeResponse 타입) | `src/_pages/home/model/` | _pages/home/model | 홈 페이지에서만 사용하는 타입 |
| `src/queries/productsQueries.ts` | `src/entities/product/api/` | entities/product/api | 상품 도메인 서버 상태 |
| `src/service/products.ts` | `src/entities/product/api/` | entities/product/api | 상품 fetch 함수, productsQueries와 같은 도메인 |
| `src/queries/homeQueries.ts` | `src/_pages/home/api/` | _pages/home/api | 홈 페이지에서만 사용 |
| `src/service/home.ts` | `src/_pages/home/api/` | _pages/home/api | 홈 fetch 함수, homeQueries와 같은 도메인 |
| `src/store/cartStore.ts` | `src/entities/cart/model/` | entities/cart/model | 장바구니 도메인 상태 (결정표 참고) |
| `src/store/wishlistStore.ts` | `src/entities/wishlist/model/` | entities/wishlist/model | 위시리스트 도메인 상태 (결정표 참고) |
| `src/hooks/useProductFilters.ts` | `src/features/product-filters/model/` | features/product-filters/model | 사용자 검색·필터 행위 로직 |
| `src/components/ProductCard.tsx` (순수 표시) | `src/entities/product/ui/` | entities/product/ui | 행위 없는 순수 상품 표시 |
| `src/components/ProductCard.tsx` (조합) | `src/widgets/product-card/` | widgets/product-card | 찜·담기 행위와 조합하는 단위 |
| `src/components/Header.tsx` | `src/widgets/header/` | widgets/header | 장바구니·위시리스트 store 조합 |
| `src/app/page.tsx` | 얇게 유지 | app | _pages/home/ui import만 |
| `src/app/products/page.tsx` | 얇게 유지 | app | _pages/product-list/ui import만 |
| `src/app/layout.tsx` | 유지 | app | root layout, Providers |
| `src/app/providers.tsx` | 유지 | app | Provider 컴포넌트 |
| `src/app/globals.css` | 유지 | app | 전역 스타일 |
| `src/app/api/` | 유지 | app | mock 백엔드, 이동 범위 제외 |

### 애매한 파일 결정표

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
|------|--------|--------|----------|------|
| `cartStore.ts` | `entities/cart/model` | `features/add-to-cart` | `entities/cart/model` | store의 핵심 정체성은 장바구니 상태(명사). addItem 등 행위는 Zustand 구현 방식상 store에 묶여 있으나 본질은 도메인 상태. widgets → entities import 방향도 규칙상 맞음 |
| `wishlistStore.ts` | `entities/wishlist/model` | `features/toggle-wishlist` | `entities/wishlist/model` | cartStore와 동일한 기준 적용 |
| `ProductCard.tsx` | `entities/product/ui` (순수 표시) | `widgets/product-card` (조합) | 둘 다 사용 | 순수 표시는 entities, 찜·담기 행위와 조합하는 단위는 widgets. entities가 features를 import하면 역방향 의존이 생기므로 상위 레이어인 widgets에서 조합 |
| `productsQueries.ts` | `entities/product/api` | `features/product-filters/api` | `entities/product/api` | features/product-filters가 import해서 쓰지만, 상품 도메인의 서버 상태 정의이므로 entities에 둔다. features → entities import 방향이 맞음 |
| `src/types/commerce.ts` | 분해 후 각 도메인 entity | `shared/types` 유지 | 분해 | 도메인 소유자가 명확한 타입(Product, CartItem, HomeResponse)은 각 entity/model로 분해. 한 파일에 모으면 도메인 경계가 없어짐 |

---

## D — Data Model

### 상태 분류표

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 이동 후에도 중복 저장하지 않는 방법 |
|------|----------------|---------------------|------------|-------------------------------------|
| 상품 조회 결과 | 서버/TanStack Query | `entities/product/api` | `_pages/product-list`, `widgets/product-card` | Zustand에 복사하지 않음 |
| 홈 데이터 | 서버/TanStack Query | `_pages/home/api` | `_pages/home/ui` | Zustand에 복사하지 않음 |
| 검색·정렬·페이지 | URL/nuqs | `features/product-filters/model` | `_pages/product-list` | 별도 useState로 동기화하지 않음 |
| 검색어 입력 draft | React 로컬 상태 | `features/product-filters/model` | 훅 내부 | debounce 전 임시값, 전역으로 올리지 않음 |
| 장바구니 | Zustand + persist | `entities/cart/model` | `widgets/header`, `widgets/product-card` | 서버 응답 복사 없음 |
| 위시리스트 | Zustand + persist | `entities/wishlist/model` | `widgets/header`, `widgets/product-card` | 서버 응답 복사 없음 |
| totalPages | 파생값 (계산) | — | `_pages/product-list` | useState 사용 안 함, 렌더 중 계산 |

---

## I — Interface

### ProductCard 조합 방법

`entities/product/ui/ProductCard`는 찜·장바구니 store를 직접 import하지 않는다. 순수 표시만 담당하고, `widgets/product-card`에서 store를 연결해 조합한다.

```
entities/product/ui/ProductCard  ← product, isInWishlist, isInCart, onToggleWishlist, onAddToCart props만 받음
widgets/product-card             ← entities/cart, entities/wishlist store 연결 후 ProductCard에 내려줌
```

### 슬라이스 Public API 방침

barrel file과 Public API를 구분한다. "외부가 알아도 되는 것은 이것뿐"이라는 계약이 필요한 슬라이스에만 `index.ts`를 둔다. 경로 축약용 `export *`는 만들지 않는다.

| 슬라이스 | index.ts | 공개할 것 | 숨길 것 |
|----------|----------|----------|---------|
| `entities/product` | ✓ | `Product` 타입, `productsQueries`, `ProductCard` | `getProducts` fetch 함수 내부 |
| `features/product-filters` | ✓ | `useProductFilters`, 필터 폼 UI | debounce 내부 로직, `lastCommitted` ref |
| 나머지 슬라이스 | 없음 | — | 숨길 내부 없음 |

---

## O — Optimization

### TanStack Query 캐시 정책 유지

폴더 이동으로 캐시 정책이 달라지지 않는다. `queryOptions` 위치만 이동하고 설정값은 그대로 유지한다.

| 쿼리 | staleTime | gcTime | 변경 여부 |
|------|----------|--------|----------|
| 홈 데이터 | 5분 | 10분 | 유지 |
| 상품 목록 | 1분 | 5분 | 유지 |

### 에러 경계 범위

| 실패 유형 | 처리 위치 | Error Boundary 전파 여부 | 이유 |
|----------|----------|------------------------|------|
| 상품 목록 조회 실패 | 인라인 | 전파하지 않음 | 헤더·필터는 살아있어야 함. 재시도 버튼 제공 |
| 잘못된 검색 조건(4xx) | 해당 없음 | 해당 없음 | URL 파서(nuqs)가 허용값으로 정규화해 발생 경로가 없음. 서버측 검증이 생기면 인라인 처리 |
| 예상 밖 렌더링 오류 | `error.tsx` | 전파함 | 복구 불가 오류는 Error Boundary로 위임 |
| 장바구니 행위 오류 | 해당 없음 | 해당 없음 | 현재 구현에서 API 호출 없음. 로컬 상태(Zustand)만 변경하므로 네트워크 에러 발생 경로 없음 |

### 에러 경계 설계 근거

- **조회 실패는 인라인 처리한다.** 상품 목록 조회가 실패해도 헤더·검색·필터는 살아있어야 한다. `throwOnError`를 추가하지 않고 `useQuery` 기본값(던지지 않음)을 그대로 쓴다.
- **`app/(commerce)/error.tsx`는 예상 밖 렌더링 오류 전담이다.** 조회 실패는 예상 가능한 실패라서 경계로 보내지 않는다.
- **상태 체크는 `data` 우선으로 한다.** `isError` 우선으로 체크하면 배경 재조회 실패 시 멀쩡한 화면이 에러 안내로 덮이는 문제가 생긴다.
- **`useSuspenseQuery`로의 전환은 이번 주 범위가 아니다.** `placeholderData: keepPreviousData`와 함께 쓰면 페이지네이션 이전 목록 유지 동작이 바뀌므로 별도 결정한다.

### 이번 주에 하지 않을 최적화

| 항목 | 이유 |
|------|------|
| 다음 페이지 prefetch | 구조 변경과 기능 추가를 같은 PR에 섞지 않음 |
| Lighthouse 최적화 | 리팩토링 완료 후 별도 진행 |
| SSR 전환 | `'use client'` 구조 유지, 서버 컴포넌트 도입은 범위 외 |

---

## 동작 기준선 검증 결과 (0단계)

| 시나리오 | 결과 |
|---------|------|
| 홈 정상·로딩·에러·빈 상태 | |
| 상품 목록 정상·로딩·에러·빈 상태 | |
| 검색·카테고리·정렬·페이지네이션 | |
| URL 공유·새로고침·앞뒤 이동 | |
| 장바구니·위시리스트 상태 동기화 | |
| `pnpm check` 통과 | |

---

## 삭제 시나리오 자가 검증 (5단계, 마이그레이션 후 작성)

과제의 두 시나리오(위시리스트 통째 제거, 신상품 뱃지 추가)에 장바구니 서버 전환 시나리오를 더해, 변경 반경이 폴더 단위로 예측되는지 검증한다.
