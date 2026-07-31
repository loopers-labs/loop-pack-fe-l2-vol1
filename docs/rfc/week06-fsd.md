# RFC — 6주차 FSD 전환

> 상태: **작성 완료(구현 전)** · 2026-07-31 · 대상 브랜치 `volume-6`
>
> 이 문서는 FSD 구조 변경 **전에** 커밋된다. 구조를 옮기기 전 기준선과 결정 근거를 먼저 고정하는 것이 목적이다.
>
> ⚠️ **AI 협업 표기 주의** — 이 문서의 설계 판단은 시간 제약으로 AI가 초안을 작성했다. 문서 끝 「AI 협업 표기」에 어느 부분이 누구의 판단인지 사실대로 적었다. 제출 전 각 결정을 검토하고, 동의하지 않는 항목은 직접 고쳐 표기도 함께 갱신할 것.

---

## 0단계 — 동작 기준선

폴더를 옮기기 전 상태를 고정한다. **이 표가 리팩토링 후 회귀 판정의 기준이다.**

### 게이트

| 항목                                                | 결과       | 측정                                            |
| ------------------------------------------------- | ---------- | --------------------------------------------- |
| `pnpm check` (test 36 · lint · typecheck · build) | **exit 0** | 2026-07-30 · `volume-6` (upstream/main 머지 직후) |
| `pnpm format:check` (CI 전용 게이트)               | **exit 0** | 〃                                             |

### 상품 목록

실행 환경: `next dev` (Next 16.2.10 · Turbopack) · Node 24.17.0 · 2026-07-29. mock API 응답에 500ms 지연이 있다.
상태 4종은 URL만으로 재현된다 — `error`는 `?page=0`(nuqs `parseAsInteger`가 clamp하지 않아 API로 그대로 전달되어 400), `empty`는 결과 없는 검색어, `pending`은 캐시 없는 필터 변경.

| #   | 시작 조건                                       | 행동                                    | 실제 결과                                                                                             |
| --- | --------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | 캐시 없음                                       | `/products`                            | 총 30개 · 카드 12 · `1 / 3` · 이전 `disabled` · 헤더 위시 0·담기 0                                     |
| 2   | `digital` 캐시 없음                             | 카테고리 → 디지털                       | `상품을 불러오는 중입니다…` **512ms** → 총 6개                                                        |
| 3   | 결과 없는 검색어                                | `/products?q=존재하지않는상품zzz`       | `조건에 맞는 상품이 없습니다.` · 카드 0 · 총개수·페이지네이션 없음 · 검색 입력값 복원                  |
| 4   | API 400 조건                                    | `/products?page=0`                     | `상품 목록을 불러오지 못했습니다.` · `role="alert"` · 카드 0 · **필터는 계속 조작 가능**              |
| 5   | 새 진입                                         | `/products?q=스탠리&sort=price-asc&page=1` | 검색 `스탠리` · 정렬 `price-asc` · 총 4개 · 42,000→44,000→65,000→75,000 · `1 / 1`                 |
| 6   | 범위 밖 페이지                                  | `…&page=2`                             | 조건 3개 복원되나 화면은 **empty** (4건이 12개/페이지에 다 들어가 총 1페이지)                          |
| 7   | `/products?page=2`                              | 카테고리 → 디지털                       | URL `?category=digital` — **`page` 파라미터 제거**(nuqs가 기본값이면 삭제). 실효 1: `1 / 1` · 총 6개 · `history.length` 8→9 |
| 8   | 직전 `category=all` 조회 후 10초 (staleTime 이내) | 디지털 → 전체 복귀                    | `pending` **미등장** · 즉시 총 30개                                                                   |
| 9   | 홈, 헤더 0·0                                    | 담기 1 + 찜 1 → 헤더 `상품` 링크        | 목록에서 위시 1·담기 1 유지                                                                           |
| 10  | 위 상태에서                                     | `/products` 직접 진입 (full reload)     | 위시 0·담기 0 (설계상 "새로고침 초기화 허용")                                                         |

### 홈

측정 2026-07-31. 홈 쿼리는 `/api/home`을 파라미터 없이 부르므로 목록과 달리 **URL로 error/empty를 만들 수 없다.**
`scenario`를 사용자 URL 상태에 넣는 것은 과제 4단계가 금지하므로, **Playwright route 인터셉트로 응답만 바꿔** 검증했다(제품 코드 변경 없음).

| 상태    | 재현 방법                                | 실제 결과                                                                                        |
| ------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| pending | 캐시 없이 `/` 진입                       | `홈을 불러오는 중입니다…` 노출 후 데이터 (진입→hero 렌더 **849ms**, 하이드레이션 포함)             |
| 정상    | 캐시 없이 `/` 진입                       | hero `매일 새롭게 발견하는 취향` · 카테고리 링크 5 · 섹션 3(카테고리·인기 상품·신상품) · 카드 12   |
| error   | `/api/home` 응답을 500으로 대체          | `홈 데이터를 불러오지 못했습니다.` · `role="alert"` · **hero·카테고리·섹션 전부 사라짐** (카드 0)  |
| empty   | 200이되 `popularProducts`·`newProducts` 빈 배열 | hero·카테고리 링크 5 **유지** · `표시할 상품이 없습니다.` 2개(인기·신상품) · 카드 0          |

> **여기서 나온 사실이 4단계 설계의 근거다.** 같은 앱 안에서 실패 경계가 세 갈래로 다르다.
>
> - **홈 error** → `app/page.tsx`가 early return이라 **배너·카테고리까지 전부 가린다.** 사용자가 할 수 있는 게 새로고침뿐.
> - **홈 empty** → 섹션 안에서만 처리해 배너·카테고리는 산다 (코드 주석에 의도가 적혀 있음).
> - **목록 error** → 필터 UI가 살아 있어 조건을 바꿔 빠져나올 수 있다 (#4).
>
> 홈만 경계가 과도하게 넓다. 4단계에서 목록 쪽으로 맞춘다.

---

## R — Requirements

### 보존해야 하는 동작

위 0단계 표 전체. 특히 폴더 이동으로 깨지기 쉬운 지점:

- **#7·#8** — nuqs 기본값 제거 동작, Query 캐시 키 동일성. 파일을 옮기면서 `queryKey` 모양이 바뀌면 #8이 즉시 깨진다.
- **#9·#10** — store가 layout 위에 있어 라우팅으로 소실되지 않는 구조. provider 위치가 바뀌면 깨진다.
- **#3·#5** — `SearchForm`의 `key={params.q}` 리셋 규칙. 컴포넌트를 옮길 때 이 key를 빠뜨리기 쉽다.

### 5주차까지의 상태 소유권 (이동 전 원본)

| 상태                               | 소유자                       | 수명                  |
| ---------------------------------- | ---------------------------- | --------------------- |
| 홈 데이터                          | 서버 · TanStack Query        | stale 5분 / gc 10분   |
| 상품 목록·totalCount               | 서버 · TanStack Query        | stale 1분 / gc 기본 5분 |
| `q` · `category` · `sort` · `page` | URL · nuqs                   | 목록 체류 + 히스토리  |
| 장바구니·위시리스트 id             | 전역 클라이언트 · Zustand    | 앱 세션(새로고침 초기화 허용) |
| 헤더 개수                          | **파생** (store에서 계산)    | —                     |
| 검색어 초안                        | 로컬 · `useState` (SearchForm) | 컴포넌트 수명       |
| 로딩·에러·빈 결과                  | **파생** (Query `status`)    | —                     |

### 비기능 요구사항

- `pnpm check` · `pnpm format:check` 통과 유지
- 구조 변경과 기능 변경을 **같은 커밋에 섞지 않는다** (과제 명시)

### 이번 주에 하지 않을 것

| 하지 않는 것                                          | 이유                                                                                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/**` 전환                                 | 과제가 제외를 허용. mock 백엔드는 프론트와 다른 축이고, 지금 옮기면 리팩토링 diff에 백엔드 이동이 섞여 리뷰가 어려워진다. 단 `types/commerce.ts` 분해 때 **공유 경계는 답해야 한다**(아래 I 섹션). |
| `src/examples/week-05-layout/` (316줄)                | 어느 코드도 import하지 않는 학습용 레이아웃 데모. FSD 레이어에 억지로 배치하면 **미사용 슬라이스**가 생긴다. 현 위치 유지.        |
| `components/ui/**/*Example.tsx` (129줄)               | 위와 같은 이유. `shared/ui`로 함께 옮기면 shared에 미사용 export가 남는다.                                                        |
| 범위 밖 `page` 값 보정 (#6)                           | 기능 변경이다. 구조 변경과 섞지 않는다. 별도 이슈로 남긴다.                                                                       |
| Advanced A(의존성 하네스) · B(변경 반경 실험)         | 필수 과제를 먼저 완성한다. 시간이 남으면 A부터 — 의존 규칙을 기계가 강제해야 구조가 유지된다.                                     |

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

**① `features/commerce/`가 feature가 아니라 "파일 종류 창고"다.**
`queries.ts`(서버 조회) · `searchParams.ts`(URL 상태) · `store.ts`(클라이언트 상태) 세 파일이 한 폴더에 있는데 셋의 도메인이 전부 다르다. 더 나쁜 건 각 파일 안에서도 섞여 있다.

- `queries.ts` 67줄 = 홈 쿼리 + 목록 쿼리 + `fetchJson` 헬퍼 + 에러 타입가드
- `store.ts` 34줄 = 장바구니 + 위시리스트가 **한 store**
- `searchParams.ts` 53줄 = nuqs parser + 화면 표시용 `categoryOptions`/`sortOptions` + 타입가드

"위시리스트를 지운다"고 하면 폴더를 지우는 게 아니라 `store.ts`를 열어 절반만 도려내야 한다.

**② `ProductCard`가 상품 표현과 사용자 행위를 한 컴포넌트에 묶고 있다.**
`components/commerce/ProductCard.tsx` → `features/commerce/store`를 직접 import해서 담기·찜 버튼을 자체 렌더한다(61줄 중 18줄이 action). 그래서 **상품만 보여주는 자리를 만들 수 없다** — 추천 목록이나 최근 본 상품을 추가하려면 카드를 복사하거나 `hideActions` 같은 boolean prop을 늘려야 한다.
FSD로 옮기면 이게 그대로 `entities/product → features/add-to-cart` **역방향 의존**이 된다. 과제가 명시적으로 금지한 형태다.

**③ `types/commerce.ts` 한 파일이 프론트·mock 백엔드·전 도메인의 공용 창고다.**
52줄에 `Product` · `Category` · `ProductSort` · `ProductListQuery` · 응답 타입 · **`MockApiScenario`**가 함께 있고, `app/api/**` 3파일과 프론트 6파일이 동시에 의존한다.
`MockApiScenario`는 mock 백엔드 전용 제어값인데 프론트 도메인 타입과 같은 파일에 산다. "이 타입의 소유자가 누구인가"에 답할 수 없는 상태다.

**④ 화면 구현이 라우팅 디렉터리 안에 있다.**
`app/products/ProductsView.tsx` 116줄, `app/page.tsx` 70줄이 라우팅 진입점과 화면 구현을 겸한다. 라우트 파일을 열지 않으면 화면 구조를 알 수 없고, 화면 로직을 고치려면 `app/`을 건드려야 한다.

### 기준 스펙 — FSD 2.1 "pages first"

이 설계는 **FSD 2.1**을 기준으로 한다. v2.0 대비 핵심 변화는 decomposition 방향이다.

- **pages first** — entity를 먼저 뽑지 않는다. **다른 페이지에서 재사용하지 않는 UI·폼·데이터 로직은 그 페이지 슬라이스에 남긴다.**
- **speculative reuse 금지** — "나중에 재사용할 것 같아서" 하위 레이어로 내리지 않는다. 레이어 네임스페이스는 전역 스코프와 같아서, 단발성 코드로 오염시키지 않는다.
- 공식 린터 **Steiger**에 이를 잡는 룰이 있다 — `insignificant-slice`(한 페이지에서만 쓰는 entity/feature를 그 페이지로 합치라고 경고), `excessive-slicing`(슬라이스 과다).
- **`processes` 레이어는 deprecated** (과제 금지와 일치).
- entity 간 cross-import는 **`@x` 표기**로 표준화되었다(entity 전용): `import type { Product } from "entities/product/@x/cart"`.

**이 기준을 현재 코드의 실사용처에 적용한 결과** — 아래 트리는 "1페이지에서만 쓰이는가"로 배치를 갈랐다.

| 대상                          | 실제 사용처            | 배치                       |
| ----------------------------- | ---------------------- | -------------------------- |
| `ProductCard` (표현)          | 홈 + 목록 **2페이지**  | `entities/product/ui`      |
| `Product` 등 도메인 타입      | 홈 · 목록 · API 라우트 | `entities/product/model`   |
| cart · wishlist store         | 헤더(전 페이지) + 행위 | `entities/{cart,wishlist}` |
| 담기 · 찜 버튼                | product-card widget → 2페이지 | `features/*`        |
| 헤더 · 상품카드 조합          | 2페이지 이상           | `widgets/*`                |
| **목록 queryOptions**         | **목록 1페이지**       | **`_pages/product-list/api`** |
| **검색·필터(nuqs·SearchForm)** | **목록 1페이지**      | **`_pages/product-list/*`** |
| 홈 queryOptions               | 홈 1페이지             | `_pages/home/api`          |

### 목표 폴더 트리

```
src/
├── app/                                Next.js 라우팅 — 얇은 진입점만
│   ├── layout.tsx                        Providers + widgets/header 조합
│   ├── page.tsx                          → _pages/home 렌더
│   ├── products/
│   │   ├── page.tsx                      → _pages/product-list 렌더 (Suspense 유지)
│   │   └── error.tsx                     (신규) 예상 밖 렌더링 오류 fallback + reset
│   └── api/**                            mock 백엔드 — 전환 제외
├── _app/
│   ├── providers.tsx                     QueryClient + NuqsAdapter
│   └── styles/{globals.css, commerce.css}
├── _pages/
│   ├── home/
│   │   ├── api/homeQuery.ts              홈 조립 응답 전용 queryOptions
│   │   └── ui/HomePage.tsx
│   └── product-list/                     ← 목록 전용 로직은 전부 여기 (pages first)
│       ├── api/productListQuery.ts       목록 queryOptions
│       ├── model/useProductListQuery.ts  nuqs parsers + history:push
│       ├── config/options.ts             categoryOptions · sortOptions
│       └── ui/{ProductListPage,SearchForm}.tsx
├── widgets/
│   ├── header/ui/Header.tsx              cart·wishlist 개수 구독
│   └── product-card/ui/ProductCardWithActions.tsx   ← 표현 + 행위 조합 지점
├── features/
│   ├── add-to-cart/ui/AddToCartButton.tsx
│   └── toggle-wishlist/ui/ToggleWishlistButton.tsx
├── entities/
│   ├── product/
│   │   ├── model/types.ts                Product · CategoryId · ProductSort · Category
│   │   └── ui/ProductCard.tsx            표현만 · actions 슬롯을 받는다
│   ├── cart/model/store.ts
│   └── wishlist/model/store.ts
└── shared/
    ├── api/{fetchJson.ts, HttpError.ts}
    ├── ui/{dialog,select}/
    └── lib/idSet.ts                      toggleId — 도메인 무관 자료구조 조작
```

### 사용할 레이어와 근거

| 레이어      | 사용 | 근거                                                                                                                        |
| ----------- | ---- | --------------------------------------------------------------------------------------------------------------------------- |
| `_app`      | ✓    | provider 배선과 전역 스타일. 라우팅(`app/`)과 분리해야 layout이 얇아진다.                                                    |
| `_pages`    | ✓    | 문제 ④를 직접 해결. **그리고 pages-first의 기본 착지점이다** — 재사용 근거가 없는 코드는 전부 여기 남는다.                   |
| `widgets`   | ✓    | 문제 ②의 해법이 여기 산다. `entities`와 `features`를 조합하는 자리가 없으면 역방향 의존을 피할 방법이 없다. 둘 다 2페이지 이상에서 쓰인다. |
| `features`  | ✓    | 담기·찜은 표현과 분리되는 사용자 행위이고, product-card widget을 통해 2페이지에서 쓰인다.                                    |
| `entities`  | ✓    | product·cart·wishlist 세 도메인이 실재하고 **전부 2곳 이상에서 쓰인다**.                                                     |
| `shared`    | ✓    | dialog·select·fetchJson처럼 도메인을 모르는 코드가 실재한다.                                                                 |
| `processes` | ✗    | v2.1에서 deprecated이고 과제도 금지.                                                                                        |

**만들지 않기로 한 것**

- **`features/filter-products`** — 검색·카테고리·정렬은 사용자 행위라 feature로 보이지만 **목록 페이지에서만 쓴다.** v2.1 기준 `insignificant-slice`에 걸린다. `_pages/product-list` 안에 `model`·`config`·`ui` 세그먼트로 둔다. 다른 페이지(예: 카테고리 전용 화면)가 같은 조건 UI를 쓰게 되면 그때 올린다.
- **`entities/product/api`** — 목록 조회는 Product 도메인 행위로 보이지만 지금 부르는 곳이 목록 페이지 하나다. 같은 이유로 `_pages/product-list/api`에 둔다. **"재사용할 것 같아서" 내리는 것이 v2.1이 경고하는 speculative reuse다.**
- **`entities/category`** — Category는 서버 응답에 딸려오고 필터 옵션은 정적 상수다. 슬라이스로 만들면 타입 하나짜리 빈 껍데기가 된다. 타입은 `entities/product/model`, 옵션 목록은 `_pages/product-list/config`.
- **`shared/config`** — 현재 넣을 것이 QueryClient 기본값뿐인데 그건 `_app/providers`가 소유한다.
- 빈 세그먼트·미사용 `index.ts` — 규칙대로 필요한 것만 만든다.

> **올릴 때의 신호**: 두 번째 페이지가 같은 것을 필요로 할 때. 그전에는 페이지 안에 둔다.
> 반대 방향(과다 추출) 점검은 Steiger를 붙이면 자동화된다 — Advanced A의 후보.

### 허용/금지 import 예시

```
✅ widgets/product-card  → entities/product, features/add-to-cart, features/toggle-wishlist
✅ features/add-to-cart  → entities/cart, shared/lib
✅ entities/product      → shared/api
✅ _pages/product-list   → widgets/product-card, entities/product, shared/api
   (검색·필터·목록 쿼리는 같은 슬라이스 내부 세그먼트끼리 — 레이어 규칙과 무관)

❌ entities/product      → features/add-to-cart        (하위가 상위를 앎 — 문제 ②의 현재 상태)
❌ entities/cart         → entities/wishlist           (같은 레이어 슬라이스 직접 참조)
❌ features/add-to-cart  → widgets/header              (하위 → 상위)
❌ shared/ui             → entities/product            (shared는 도메인을 몰라야 함)
❌ _pages/home           → _pages/product-list         (같은 레이어 슬라이스 직접 참조)
```

entity 간 참조가 정말 필요해지면(예: cart가 Product 타입을 알아야 할 때) ad-hoc import 대신 **`@x` public API**를 쓴다 — `entities/product/@x/cart`에 cart용 계약만 노출한다. 현재는 필요 없다.

### 단계별 마이그레이션 계획

각 단계마다 `pnpm check`를 돌리고, 아래 회귀 항목을 확인한다. **단계마다 커밋을 나눈다.**

| 단계 | 내용                                                                 | 회귀 확인            |
| ---- | -------------------------------------------------------------------- | -------------------- |
| 1    | `shared` — `fetchJson`·`HttpError` 추출, `ui/{dialog,select}` 이동     | `pnpm check`         |
| 2    | `entities/product` — types·표현 전용 ProductCard                       | #1 #5                |
| 3    | `entities/{cart,wishlist}` — store 2개로 분리                          | #9 #10               |
| 4    | `features` — add-to-cart · toggle-wishlist                            | #1 #9                |
| 5    | `widgets` — header · product-card 조합 (문제 ② 해소)                   | #1 #9 #10            |
| 5.5  | `_pages/product-list` — 목록 쿼리·nuqs·옵션·SearchForm을 페이지 슬라이스로 | #1 #3 #5 #7 **#8** |
| 6    | `_pages/home` + `_app`, `app/`을 얇은 진입점으로                        | **0단계 전체 재실행** |
| 7    | Public API `index.ts` 추가                                            | `pnpm check`         |
| 8    | 에러 경계 (**기능 변경 — 별도 커밋**)                                  | #4 + 홈 error·empty  |

### 파일 매핑표

| 현재 위치                              | 목표 위치                                        | 레이어 / 슬라이스 / 세그먼트         | 이유                                                                 |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------- |
| `app/layout.tsx`                       | 유지 (내용 축소)                                 | Next 라우팅                          | 라우팅 파일. Providers·Header 조합만 남긴다                          |
| `app/providers.tsx`                    | `_app/providers.tsx`                             | `_app`                               | 라우팅이 아니라 앱 배선                                              |
| `app/page.tsx`                         | `_pages/home/ui/HomePage.tsx`                    | `_pages/home/ui`                     | 문제 ④. 라우트는 이걸 렌더만 한다                                    |
| `app/page.tsx`의 홈 쿼리 사용          | `_pages/home/api/homeQuery.ts`                   | `_pages/home/api`                    | 응답이 banner+categories+2섹션 **조립본**이라 특정 entity의 것이 아니다 |
| `app/products/page.tsx`                | 유지 (Suspense만)                                | Next 라우팅                          | nuqs가 Suspense 경계를 요구 — 라우트에 남는 게 맞다                  |
| `app/products/ProductsView.tsx`        | `_pages/product-list/ui/ProductListPage.tsx`     | `_pages/product-list/ui`             | 문제 ④                                                               |
| `components/commerce/Header.tsx`       | `widgets/header/ui/Header.tsx`                   | `widgets/header/ui`                  | 두 entity(cart·wishlist)를 조합해 보여주는 독립 블록                 |
| `components/commerce/ProductCard.tsx`  | **분할** → `entities/product/ui/ProductCard.tsx` + `widgets/product-card/ui/ProductCardWithActions.tsx` | `entities` + `widgets` | 문제 ②. 표현과 행위를 나누고 widget에서 조합                         |
| `components/commerce/SearchForm.tsx`   | `_pages/product-list/ui/SearchForm.tsx`          | `_pages/product-list/ui`             | 조건 확정이라는 사용자 행위지만 **목록 1페이지에서만 쓴다** — pages first |
| `components/commerce/commerce.css`     | `_app/styles/commerce.css`                       | `_app`                               | 전역 클래스(`shop-*`) 기반이라 슬라이스로 쪼갤 수 없다. 분해는 이번 범위 밖 |
| `components/ui/dialog/index.tsx`       | `shared/ui/dialog/`                              | `shared/ui`                          | 도메인을 모르는 재사용 UI                                            |
| `components/ui/select/index.tsx`       | `shared/ui/select/`                              | `shared/ui`                          | 〃                                                                   |
| `features/commerce/queries.ts`         | **분할** → `_pages/product-list/api/productListQuery.ts` + `_pages/home/api/homeQuery.ts` + `shared/api/fetchJson.ts` | 3곳 | 문제 ①. 한 파일에 세 관심사. 두 쿼리 모두 **각자 1페이지 전용** |
| `features/commerce/searchParams.ts`    | **분할** → `_pages/product-list/model/` + `config/options.ts` | `_pages/product-list` | parser(동작)와 표시용 옵션(설정)을 나누되, 둘 다 목록 페이지 전용     |
| `features/commerce/store.ts`           | **분할** → `entities/cart/model/store.ts` + `entities/wishlist/model/store.ts` | `entities` ×2 | 문제 ①. 삭제 시나리오에서 폴더 삭제로 끝나게                         |
| `types/commerce.ts`                    | **분할** (아래 결정표 참조)                      | `entities/product/model` 외          | 문제 ③                                                               |
| `app/globals.css` · `page.module.css`  | `_app/styles/`                                   | `_app`                               | 전역 스타일                                                          |
| `examples/week-05-layout/**`           | **유지**                                         | —                                    | 미사용 데모. 이번 전환 대상 제외 (R 참조)                            |
| `components/ui/**/*Example.tsx`        | **유지**                                         | —                                    | 〃                                                                   |
| `app/api/**`                           | **유지**                                         | —                                    | 과제가 제외 허용 (R 참조)                                            |

### 애매한 파일 결정표

| 대상                            | 후보 A                   | 후보 B                          | 최종 결정                                                     | 기준                                                                                                          |
| ------------------------------- | ------------------------ | ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ProductCard`                   | `entities/product/ui`    | `widgets/product-card`          | **둘 다** — 표현은 entity, 행위 조합은 widget                 | 재사용 범위가 다르다. 표현은 상품이 나오는 모든 화면이 쓰고, 행위 조합은 담기·찜이 필요한 화면만 쓴다. 하나로 두면 문제 ② |
| 상품 목록 queryOptions          | `entities/product/api`   | 목록 페이지의 `api`             | **목록 페이지의 `api`**                                       | 도메인만 보면 A가 맞아 보이지만 **부르는 곳이 목록 1페이지뿐**이다. FSD 2.1 `insignificant-slice` — "재사용할 것 같아서" 내리는 건 speculative reuse다. 두 번째 페이지가 생기면 그때 `entities`로 올린다 |
| 홈 queryOptions                 | `entities/product/api`   | `_pages/home/api`               | **`_pages/home/api`** (직접 추가한 항목)                      | 위와 같은 기준 + 응답이 `banner + categories + popularProducts + newProducts` **화면 조립본**이라 애초에 entity의 것이 아니다 |
| 검색·필터 (nuqs + SearchForm)   | `features/filter-products` | 목록 페이지 세그먼트          | **목록 페이지 세그먼트** (직접 추가한 항목)                   | "조건을 바꾼다"는 사용자 행위라 feature로 보이지만 목록 1페이지 전용이다. feature로 뽑으면 `insignificant-slice` |
| 장바구니 store                  | `entities/cart/model`    | 장바구니 행위 feature의 `model` | **`entities/cart/model`**                                     | "무엇이 담겼나"는 상태(명사), "담는다"는 행위(동사). 헤더는 행위 없이 상태만 필요하다 — feature에 두면 헤더가 feature를 의존하게 된다 |
| `types/commerce.ts`의 `Product` | `entities/product/model` | `shared/types` 유지             | **`entities/product/model`**, 단 `MockApiScenario`는 API 라우트로 | 도메인 타입을 shared에 두면 shared가 도메인을 알게 되어 "아무나 의존해도 되는 층"이 도메인 변경에 흔들린다     |
| `MockApiScenario`               | `entities/product/model` | `app/api/` 내부                 | **`app/api/` 내부** (직접 추가한 항목)                        | mock 백엔드 전용 제어값이다. 프론트는 이 타입을 몰라야 한다 — 알면 `scenario`를 사용자 상태에 넣고 싶어진다(4단계 금지 사항) |

> **`types/commerce.ts` 분해 시 공유 경계**: `app/api/**`는 응답을 만들고 프론트는 소비한다. 응답 타입(`HomeResponse`·`ProductListResponse`)은 **계약**이라 양쪽이 공유해야 한다.
> 결정 — 계약 타입은 `entities/product/model`에 두고 `app/api/**`가 그것을 import한다. mock 백엔드가 프론트 entity를 참조하는 방향이 되지만, 실제 백엔드로 교체되면 이 의존은 사라지고 OpenAPI 스키마 등으로 대체될 자리다. 반대 방향(프론트가 `app/api`를 의존)은 라우팅 디렉터리에 도메인이 묶여 더 나쁘다.

---

## D — Data Model

| 상태                | Source of Truth     | 소유 슬라이스/레이어                                       | 소비하는 곳                                                | 이동 후에도 중복 저장하지 않는 방법                                                                                     |
| ------------------- | ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 상품 조회 결과      | 서버/TanStack Query | 목록 `_pages/product-list/api` · 홈 `_pages/home/api`      | 각자 자기 페이지                                            | `queryOptions` 팩토리만 두고 응답 데이터를 밖으로 내보내지 않는다. 화면은 `useQuery(...)` 반환값을 그대로 읽고 store·state로 복사하지 않는다 |
| 검색·정렬·페이지    | URL/nuqs            | `_pages/product-list/model`                                 | `_pages/product-list`                                       | `useProductListQuery()` 훅 하나로 읽고 쓴다. 조건을 `useState`로 미러링하지 않는다. 제출 전 검색 초안만 `SearchForm` 내부 `useState`에 두고 `key={q}`로 리셋 |
| 장바구니·위시리스트 | Zustand             | `entities/cart/model` · `entities/wishlist/model`            | `widgets/header`, `features/add-to-cart`, `features/toggle-wishlist` | id 집합(`Record<id,true>`)만 저장. 개수는 selector에서 파생(`Object.keys().length`). 상품 상세는 서버 소유라 저장하지 않고 필요 시 id로 조회 |
| Dialog 열림 여부    | React 로컬 상태     | `shared/ui/dialog` 내부                                     | 해당 UI                                                     | 컴파운드 컴포넌트 내부 `useState`. 전역으로 올리지 않는다                                                              |

> 금지 재확인: 폴더를 옮기면서 서버 응답을 Zustand에 복사하거나, URL 상태를 별도 `useState`에 동기화하지 않는다.
> 현재 지키고 있는 지점 — 헤더 개수는 파생, store에는 id만. **이동 후 회귀 확인은 #9·#10.**

---

## I — Interface

### 각 슬라이스가 공개할 값과 숨길 구현

| 슬라이스                   | 공개                                                                       | 숨김                                                              | 숨기는 이유                                                                     |
| -------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `entities/product`         | `Product`·`CategoryId`·`ProductSort` 타입, `ProductCard`                    | —                                                                 | 표현과 타입만 남는다. 조회는 페이지가 소유하므로 여기서 숨길 API 상세가 없다     |
| `entities/cart`            | `useCartCount`·`useIsInCart`·`useToggleCart`                                | **`useCollectionStore` raw store**                                | raw store를 공개하면 외부가 store 전체를 구독해 selector 리렌더 경계가 무너진다 |
| `entities/wishlist`        | `useWishlistCount`·`useIsInWishlist`·`useToggleWishlist`                    | raw store                                                         | 〃                                                                              |
| `_pages/product-list`      | 페이지 컴포넌트만                                                          | 목록 queryOptions, nuqs parser·`history:"push"`, 옵션 목록, SearchForm | 전부 이 페이지 내부 사정이다. 밖에서 쓸 일이 생기는 순간이 곧 승격 신호        |
| `features/add-to-cart`     | `AddToCartButton`                                                          | cart store 접근 방식                                              | 버튼이 곧 계약. 어떤 store를 쓰는지는 내부 사정                                 |
| `widgets/product-card`     | `ProductCardWithActions`                                                   | 어떤 feature를 조합했는지                                         | 행위가 늘어도 소비자 코드가 안 바뀐다                                           |
| `shared/api`               | `fetchJson`, `HttpError`                                                   | —                                                                 | 도메인을 모르는 층이라 숨길 것이 없다                                           |

### `ProductCard`와 장바구니·위시리스트 행위의 조합

**결정: `ProductCard`가 `actions` 슬롯을 받고, `widgets/product-card`에서 조합한다.**

```tsx
// entities/product/ui/ProductCard.tsx — 표현만. features를 모른다.
export function ProductCard({ product, actions }: { product: Product; actions?: ReactNode }) {
  return (
    <article className="shop-product">
      {/* image · brand · name · price */}
      {actions !== undefined && <div className="shop-actions">{actions}</div>}
    </article>
  );
}

// widgets/product-card/ui/ProductCardWithActions.tsx — 조합 지점
export function ProductCardWithActions({ product }: { product: Product }) {
  return (
    <ProductCard
      product={product}
      actions={
        <>
          <ToggleWishlistButton productId={product.id} productName={product.name} />
          <AddToCartButton productId={product.id} productName={product.name} />
        </>
      }
    />
  );
}
```

- `entities/product`는 `features/*`를 **import하지 않는다** — 역방향 의존이 사라진다.
- 상품만 보여주는 화면은 `ProductCard`를 `actions` 없이 쓴다. boolean prop이 필요 없다.
- 행위가 늘어도(비교하기 등) `entities`는 그대로다.
- 버튼이 `productId`만 받는 이유: 행위에 필요한 건 id뿐이다. `Product` 전체를 넘기면 feature가 상품 스키마 변경에 묶인다. `productName`은 `aria-label` 문구용으로만 받는다.

### Public API 사용 여부와 방식

**결정: 슬라이스 루트 `index.ts`를 두되, 전 슬라이스가 아니라 "숨길 것이 있는 슬라이스"에만 둔다. `export *`는 쓰지 않고 명시적 named export만.**

barrel과 Public API를 가르는 건 파일 이름이 아니라 **무엇을 숨기려고 만들었는가**다.

| 슬라이스                                          | `index.ts` | 판단                                                                                                    |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `entities/cart` · `entities/wishlist`             | **둔다**   | raw store를 숨기는 **진짜 계약**이다. selector만 공개해 리렌더 경계를 보존한다                          |
| `entities/product`                                | **둔다**   | 타입과 `ProductCard`만 공개한다. `actions` 슬롯 계약이 외부와의 접점이라 이걸 명시하는 값이 있다        |
| `features/*`                                      | **둔다**   | 각 feature는 버튼 컴포넌트 1개가 계약이다. 어떤 store를 쓰는지는 숨긴다                                 |
| `widgets/*`                                       | **둔다**   | 조합 결과만 공개하고 어떤 feature를 썼는지 숨긴다                                                       |
| `_pages/*`                                        | **두지 않는다** | `app/*/page.tsx` 한 곳에서만 import한다. 숨길 대상이 없어 경로만 줄이는 **barrel**이 된다. 페이지 내부 세그먼트(api·model·config)는 애초에 밖에서 부르지 않는다 |
| `shared/*`                                        | **두지 않는다** | 도메인을 모르는 층이라 숨길 것이 없다. 파일 경로로 직접 import한다                                  |

규칙: `index.ts`에 `export *`를 쓰지 않는다. `export *`는 "무엇을 공개할지 고르지 않았다"는 뜻이라 Public API가 아니라 barrel로 되돌아간다.

---

## O — Optimization

### TanStack Query 캐시 정책 — 유지

| 쿼리 | query key                                | 캐시 entry 수                    | staleTime | gcTime                  |
| ---- | ---------------------------------------- | -------------------------------- | --------- | ----------------------- |
| 홈   | `["home"]` — 상수                        | 항상 1개                         | 5분       | 10분 (명시)             |
| 목록 | `["products", {q, category, sort, page}]` | 조건 조합마다 1개, 상한 없음     | 1분       | 기본 5분 (의도적 미명시) |

전역 기본값 `staleTime 60초` · `retry 1`. 근거 전문은 `docs/week-05-design.md`.

**결정: 값도 key 모양도 바꾸지 않는다.** 이번 주는 리팩토링이고, 캐시 정책은 5주차에 근거를 세워 정한 것이다. 폴더가 바뀌었다는 이유로 성능 특성을 함께 바꾸면 회귀가 생겼을 때 원인이 구조인지 정책인지 가릴 수 없다.

> ⚠️ **`queryKey`가 바뀌면 캐시 동일성이 깨진다.** 파일을 옮기며 key 조립 방식을 "정리"하고 싶어지는데, 그러면 0단계 **#8**(캐시 적중 시 pending 미등장)이 즉시 깨진다. 단계 2 완료 직후 #8을 반드시 확인한다.

### 로딩·에러 경계 범위

| 수단                     | 맡는 범위                                                        | 현재                                                       |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `app/products/page.tsx`의 Suspense | **라우트 진입 시 `useSearchParams` 준비**              | 있음. nuqs가 요구해서 존재한다                             |
| Query `isPending`        | **데이터 조회 중**                                                | 있음. 0단계 #2 · 홈 pending                                |
| `app/products/error.tsx` | 예상 밖 렌더링 오류                                               | **없음 — 4단계에서 추가**                                  |

둘 다 필요하고 역할이 다르다. Suspense fallback은 "URL 조건을 아직 못 읽음", `isPending`은 "조건은 읽었고 서버 응답 대기 중"이다. Suspense를 없애면 nuqs가 깨지고, `isPending`을 Suspense로 대체하면(`useSuspenseQuery`) 조건이 바뀔 때마다 화면 전체가 fallback으로 날아가 필터 UI까지 사라진다 — #4에서 확인한 "필터는 살아 있어야 한다"는 요건과 충돌한다.

### 이번 주에 하지 않을 최적화

| 하지 않는 것                             | 이유                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `placeholderData`로 필터 전환 중 이전 결과 유지 | UX 개선이지만 **기능 변경**이다. 0단계 #2의 pending 노출이 사라져 기준선 자체가 바뀐다      |
| 목록 `gcTime` 명시                       | 5주차에 기본값 채택을 근거와 함께 결정했다. 구조 변경과 같은 주에 흔들지 않는다                  |
| `prefetchQuery`·SSR 프리페치             | 서버 컴포넌트 경계를 다시 그려야 해서 FSD 전환과 diff가 뒤섞인다                                 |
| 코드 스플리팅·번들 최적화                | 측정된 문제가 없다. 구조가 잡힌 뒤 측정하고 판단할 일                                            |

---

## 4단계 — 에러 처리 경계 설계

### 경계 표

| 실패 유형                     | 처리 위치                        | Error Boundary로 전파                 | 사용자 UI                                      | 재시도 방법                | 이 경계를 선택한 이유                                                                                     |
| ----------------------------- | -------------------------------- | ------------------------------------- | ---------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 상품 목록 조회 실패 (5xx·네트워크) | `_pages/product-list` 인라인 | **아니오**                            | 목록 영역만 에러 문구 + 재시도 버튼            | `refetch()`                | 필터 UI가 살아 있어야 조건을 바꿔 빠져나올 수 있다. 전체를 가리면 사용자가 할 수 있는 게 새로고침뿐 (#4에서 확인) |
| 잘못된 검색 조건 (4xx)        | `_pages/product-list` 인라인     | **아니오**                            | 조건 안내 + 조건 초기화 링크                   | 조건 변경                  | 사용자가 URL로 만들 수 있는 상태다(`?page=0`, 0단계 #4). 복구 가능하므로 화면 안에서 처리                 |
| 홈 조회 실패                  | `_pages/home` **섹션 단위**      | **아니오**                            | 상품 섹션만 에러, **배너·카테고리는 유지**     | `refetch()`                | 현재는 early return이라 전부 가린다. empty가 이미 섹션 단위로 처리되므로(측정 확인) error도 같은 범위로 맞춘다 |
| 예상하지 못한 렌더링 오류     | `app/products/error.tsx`         | **예**                                | 라우트 fallback + 다시 시도                    | `reset()`                  | 코드 버그라 화면 안에서 복구할 수단이 없다. 라우트 단위로 격리해 헤더·레이아웃은 살린다                   |
| 장바구니 행위의 비즈니스 오류 | **해당 없음**                    | —                                     | —                                              | —                          | 현재 토글은 Zustand 로컬 연산이라 실패 경로가 없다. **서버 동기화나 재고 검증이 생기면** 필요 — 그때는 낙관적 업데이트 롤백 + 인라인 토스트 |

### `throwOnError` 기준

```ts
throwOnError: (error) => error instanceof HttpError && error.status >= 500;
```

- **5xx·네트워크 오류** → 경계로 전파. 사용자가 조건을 바꿔도 해결되지 않는다.
- **4xx·빈 결과** → 인라인. 사용자 입력으로 만들어진 상태라 화면 안에서 고칠 수 있다.

이 기준은 위 표의 `전파하는가` 열과 일치한다. 지금 `fetchJson`은 상태 코드를 버리고 `Error(message)`만 던지므로, 구분하려면 **`shared/api/HttpError.ts`에 `status`를 담는 에러 타입**이 필요하다.

### 공통 에러 타입

```
shared/api/HttpError.ts    status를 가진 HTTP 오류 (네트워크 실패는 status 없음으로 구분)
```

- 네트워크·HTTP·비즈니스 오류를 구분한다.
- **`shared`에는 화면 문구·행위를 넣지 않는다.** "상품 목록을 불러오지 못했습니다" 같은 문구는 그 화면이 소유한다. shared는 `status`와 원본 `message`만 전달한다.

### Error Boundary가 잡지 못하는 것

React Error Boundary는 **렌더 단계에서 throw된 오류만** 잡는다. 이벤트 핸들러와 비동기 콜백은 React 렌더 사이클 밖에서 실행되므로 전파되지 않는다.

- 담기·찜 버튼의 `onClick` 안에서 나는 오류 → 핸들러 안에서 처리한다. 서버 동기화가 생기면 mutation의 `onError`로.
- Query의 `queryFn` 실패는 Query가 잡아 `status: "error"`로 바꾸고, `throwOnError`가 참일 때만 렌더 단계에서 다시 던져 경계로 보낸다. 그래서 위 기준이 동작한다.

### 구현 체크리스트

- [ ] `shared/api/HttpError.ts` — `status` 보존
- [ ] `fetchJson`이 `HttpError`를 던지도록 변경
- [ ] 목록·홈에 `throwOnError` 기준 적용
- [ ] 목록: 에러 시 필터 UI 유지 + `refetch()` 버튼 (#4 유지 확인)
- [ ] 홈: early return 제거 → 섹션 단위 에러로 변경 (배너·카테고리 유지)
- [ ] `app/products/error.tsx` + `reset`
- [ ] 검증 후 임시 `throw` **전부 제거**

> ⚠️ `scenario`는 mock API 전용 제어값이다. 사용자 URL 상태나 `ProductListQuery`에 넣지 않는다.
> 검증은 0단계 홈 표에서 쓴 것과 같은 방식(응답 인터셉트)으로 한다 — 제품 코드를 건드리지 않는다.

---

## 5단계 — 삭제 시나리오 자가 검증

> 폴더 이동이 **끝난 뒤** 코드를 수정하지 않고 답한다. 아래는 목표 구조 기준 **예측**이며, 전환 완료 후 실제와 대조해 갱신한다.

### "위시리스트 기능을 통째로 제거한다면"

**삭제할 폴더·파일**

```
entities/wishlist/            (store)
features/toggle-wishlist/     (버튼)
```

**삭제 후 수정이 필요한 파일**

```
widgets/product-card/ui/ProductCardWithActions.tsx   actions에서 버튼 1개 제거
widgets/header/ui/Header.tsx                          위시리스트 개수 표시 제거
```

**판정**: 삭제 2폴더 + 수정 2파일, 모두 예측 가능. 수정 지점이 **조합 자리(widgets)에만** 생기는 것이 핵심이다.
현재 구조라면 `features/commerce/store.ts`를 열어 절반만 도려내고, `components/commerce/ProductCard.tsx` 안의 버튼과 훅 import를 찾아 지워야 한다 — **grep 없이는 못 찾는다.**

### "신상품 뱃지를 상품 카드에 추가한다면"

**터치할 파일**

```
entities/product/ui/ProductCard.tsx     뱃지 렌더 추가
entities/product/lib/isNew.ts           (신규) createdAt 기준 판정
_app/styles/commerce.css                뱃지 스타일
```

**판정**: 3파일, 전부 `entities/product` 안(스타일 제외). `Product.createdAt`이 이미 있어 타입 변경이 없다.
스타일이 밖으로 새는 건 전역 CSS(`shop-*`)를 쓰기 때문이며, 이번 주에 고치지 않기로 한 항목이다(매핑표 `commerce.css` 행).

### 발견한 파편화와 처리

| 파편화                                                  | 이번 주 처리                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| 전역 CSS(`shop-*`)가 슬라이스 경계를 넘는다             | **남긴다.** CSS 분해는 별도 작업이고 구조 diff와 섞이면 리뷰 불가   |
| `app/api/**`가 프론트 entity 타입을 참조하게 된다       | **남긴다.** 실제 백엔드로 교체될 때 사라질 의존 (I 섹션 참조)      |
| `examples/`·`*Example.tsx`가 어느 레이어도 아니다       | **남긴다.** 제품 코드가 아니다 (R 참조)                            |

---

## Advanced — 선택 (필수 아님)

시간이 남으면 **A부터.** 의존 규칙은 문서로만 두면 다음 주에 무너진다. 최소 2규칙(하위→상위 금지, 같은 레이어 슬라이스 직접 참조 금지)을 ESLint `import/no-restricted-paths`로 강제하는 것이 가장 비용이 낮다.
B(변경 반경 실험)는 5단계 예측을 실제로 검증하는 값이 있지만, 기능 추가라 구조 커밋과 분리해야 한다.

---

## AI 협업 표기

`docs/week-05-design.md`의 표기 방식을 따른다. **이번 문서는 5주차와 비중이 다르므로 사실대로 적는다.**

| 구분                              | 항목                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI가 실행·기록 (측정)**         | 0단계 기준선 — 상품 목록 10행(2026-07-29), 홈 4상태(2026-07-31, Playwright route 인터셉트), `pnpm check`·`format:check` 결과                                              |
| **AI가 작성 (사실 추출)**         | 현재 폴더 트리, 내부 의존 그래프 10개 엣지 — 레포에서 그대로 뽑은 것                                                                                                     |
| **AI가 초안 작성 (설계 판단)**    | **A·D·I·O의 결정 전부** — 문제 4개 진단, 목표 트리, 레이어 선택과 미사용 결정, 파일 매핑표, 애매한 파일 결정표, 상태 소유 슬라이스, Public API 방침, 에러 경계 표와 `throwOnError` 기준, 삭제 시나리오 예측 |
| **직접 결정**                     | 5주차 상태 소유권 원본(`week-05-design.md`), 캐시 정책 값과 근거                                                                                                        |

> 시간 제약으로 설계 판단까지 AI 초안에 의존했다. **제출 전 각 결정을 검토하고, 근거에 동의하지 않는 항목은 직접 고친 뒤 이 표를 갱신한다.**
> 특히 다음 셋은 트레이드오프가 갈리는 지점이라 본인 판단이 필요하다.
>
> 1. **목록 쿼리·검색 필터를 페이지 슬라이스에 남긴 것** — FSD 2.1 pages-first를 따른 결정이다. 강의 자료가 entity-first(v2.0)를 기준으로 설명한다면 근거를 어느 쪽에 둘지 정해야 한다. 트리를 바꾸지 않더라도 **"왜 안 내렸는가"를 설명할 수 있으면 된다.**
> 2. cart·wishlist store를 2개로 나눈 것 — 한 store 유지 + 슬라이스만 분리도 가능하다
> 3. `app/api/**`가 프론트 entity 타입을 참조하게 한 방향

### 참고한 FSD 스펙

- [Layers | Feature-Sliced Design](https://feature-sliced.design/docs/reference/layers) — 레이어 순서, import 규칙, 같은 레이어 cross-import
- [Migration from v2.0 to v2.1](https://feature-sliced.design/docs/guides/migration/from-v2-0) — pages-first, `processes` deprecated, `@x` cross-import 표준화
- [Release v2.1: Pages come first!](https://github.com/feature-sliced/documentation/releases/tag/v2.1)

초안 1차(`ad1b0cd`)는 v2.0식 entity-first로 작성해 목록 쿼리와 검색 필터를 `entities`·`features`로 내렸다가, v2.1 확인 후 페이지 슬라이스로 되돌렸다.
