# RFC: FSD(Feature-Sliced Design) 구조 전환

## R — Requirements

### 보존해야 할 동작

- 홈·상품 목록의 정상·로딩·에러·빈 상태
- 검색·카테고리·정렬·페이지네이션
- URL 공유·새로고침·뒤로/앞으로 가기
- 장바구니·위시리스트 상태 동기화 (헤더 개수, 페이지 이동 시 유지)
- `pnpm check` 통과

### 이번 주에 하지 않는 것

- `src/app/api/` Route Handler는 전환 범위에서 제외 — 프론트엔드 구조 리팩토링에 집중
- 서비스 함수(`productService`, `homeService`)와 mock 데이터(`commerce.ts`)는 아키텍처 리뷰 후 FSD 레이어로 이동 (아래 마이그레이션 8단계)
- 새로운 기능 추가 없음 (구조 변경과 기능 변경을 같은 커밋에 섞지 않음)

---

## A — Architecture

### 현재 구조에서 겪는 문제

1. **도메인 응집 부재** — `types/commerce.ts`에 모든 도메인 타입이 한 파일에 모여 있어 소유자가 불명확. Product 타입을 수정하려면 cart·wishlist와 무관한 파일을 건드려야 함
2. **의존 방향 규칙 없음** — `components/CartDialog.tsx`가 `store/cartStore` + `queries/productQueries`를 자유롭게 import. 어떤 방향이 허용되고 금지되는지 구조적 보장이 없음
3. **기능 파편화** — 장바구니 관련 코드가 `store/cartStore.ts`, `components/CartDialog.tsx`, `types/commerce.ts`에 흩어져 있어, "장바구니를 제거한다면 어디를 건드려야 하는가?"에 grep 없이 답할 수 없음

### 현재 폴더 트리 (Before)

```
src/
├── app/
│   ├── api/_data/          # mock 데이터 + 서비스
│   ├── products/           # 상품 목록·상세 페이지
│   ├── _components/        # HeaderNav
│   ├── page.tsx / HomeClient.tsx
│   ├── layout.tsx / providers.tsx
│   └── getQueryClient.ts
├── components/
│   ├── CartDialog.tsx
│   ├── icons/
│   └── ui/ (dialog, select)
├── queries/                # homeQueries, productQueries
├── store/                  # cartStore, wishlistStore
├── types/                  # commerce.ts (통짜)
└── utils/                  # format.ts
```

### 목표 폴더 트리 (After)

```
src/
├── app/                    # Next.js 라우팅 진입점 (얇은 셸)
│   ├── api/
│   │   ├── _data/          # Route Handler 전용 mock 유틸·타입
│   │   │   ├── mock.ts     # waitForMockApi
│   │   │   └── types.ts    # ApiErrorResponse, MockApiScenario
│   │   ├── home/route.ts
│   │   └── products/route.ts
│   ├── products/
│   │   ├── page.tsx        # → _pages/products import
│   │   ├── error.tsx
│   │   └── [id]/
│   │       ├── page.tsx    # → _pages/product-detail import
│   │       └── error.tsx
│   ├── error.tsx
│   ├── page.tsx            # → _pages/home import
│   ├── layout.tsx / providers.tsx
│   └── getQueryClient.ts
├── _pages/
│   ├── home/
│   │   ├── ui/             # HomeClient
│   │   └── api/            # homeQueries, homeService, types (HomeResponse)
│   ├── product-list/
│   │   ├── ui/             # ProductListContent
│   │   └── lib/            # useProductSearchParams
│   └── product-detail/
│       └── ui/             # ProductDetailContent, OptionSelect, SizeSelect
├── features/
│   └── cart/
│       └── ui/             # CartDialog
├── widgets/
│   └── product-card/
│       └── ui/             # ProductCard, ProductCardSkeleton
├── entities/
│   ├── product/
│   │   ├── model/          # Product 타입, 상수 (CATEGORY_IDS 등)
│   │   └── api/            # productQueries, productService, commerce (mock 데이터)
│   ├── cart/
│   │   └── model/          # cartStore
│   └── wishlist/
│       └── model/          # wishlistStore
└── shared/
    ├── ui/                 # Dialog, Select, icons
    └── lib/                # formatWon 등
```

### 사용할 레이어와 선택 근거

| 레이어 | 사용 | 근거 |
|--------|------|------|
| **shared** | ✅ | Dialog, Select, icons, formatPrice 등 도메인 무관 코드가 명확히 존재함 |
| **entities** | ✅ | product, cart, wishlist — 3개 비즈니스 도메인이 명확 |
| **features** | ✅ | 아래 상세 참고 |
| **widgets** | ✅ | 홈·상품 목록·장바구니 피드가 공유하는 상품 카드와 스켈레톤 |
| **_pages** | ✅ | 아래 상세 참고 |
| **_app** | ❌ | 아래 상세 참고 |

#### features — 처음 ❌ → 최종 ✅ (복원)

처음에는 "장바구니·위시리스트 행위가 get/set 정도로 단순하니까 entities에 합쳐도 되지 않을까?"라고 판단했다. READ 수준의 단순 행위에 features 레이어를 만드는 건 과한 것 같았기 때문.

하지만 CartDialog의 import 관계를 분석하면서 생각이 바뀌었다:

```
CartDialog imports:
  - cartStore        → entities/cart    (같은 슬라이스면 OK)
  - productQueries   → entities/product (같은 레이어 다른 슬라이스 — 위반!)
```

CartDialog는 cart store에서 담은 상품 id를 읽고, product queries로 해당 상품의 최신 정보를 조회해서 보여준다. **두 엔티티를 조합하는 컴포넌트**인데, FSD에서 같은 레이어의 다른 슬라이스끼리는 직접 import가 금지되므로 entities/cart/ui에 넣으면 규칙 위반이다.

그래서 `_pages`에 넣는 것도 고려했지만, CartDialog는 전역(providers.tsx)에서 렌더링되어 **모든 페이지에서 공유**된다. 특정 페이지에 속하지 않으므로 `_pages`에 넣는 것도 부자연스럽다.

features/cart에 CartDialog를 배치하기로 결정. features 레이어는 CartDialog 하나를 위해 복원되었고, cart만 둔다.

#### widgets — 처음 ❌ → 최종 ✅

widgets의 역할은 "여러 페이지에서 재사용되는 독립적인 큰 UI 블록"이다. 처음에는 ProductCard가 홈/목록/상세 3곳에서 쓰이니까 widget 후보인가 싶었지만, 실제 코드를 확인하면:

| 위치 | 구현 | 차이점 |
|------|------|--------|
| `HomeClient.tsx` | 내부 `ProductCard` 컴포넌트 | 할인 뱃지, 둥근 이미지, 브랜드+이름+가격 |
| `ProductListContent.tsx` | 인라인 `<article>` + 별도 `ProductActions` | 뱃지 없음, 다른 레이아웃 |
| `ProductDetailContent.tsx` | 완전히 다른 상세 뷰 | 별개 UI |

홈과 목록의 카드가 같은 컴포넌트가 아니다 (각각 다른 마크업). 여러 페이지에서 재사용되는 독립 UI 블록이 없으므로 widgets 레이어는 불필요.

#### 2026-09-01 — 장바구니 전체상품 피드 추가 후 재검토

공개 `/cart`의 빈 상태 아래에도 전체상품 무한 피드가 추가되면서 `widgets/product-feed` 도입을 다시 검토했다. 상품 목록 화면은 검색·카테고리·정렬 URL 상태와 목록 갱신 상태를 소유하지만, 장바구니 피드는 고정된 기본 조건과 빈 장바구니의 탐색 맥락만 소유한다. 카드의 heading 단계와 접근 가능한 버튼 이름도 각 페이지 문맥에 맞춰 다르다.

두 화면이 공유하는 것은 상품 목록 조회 계약과 다음 페이지 계산이므로 `entities/product/api`의 `productListInfiniteQueryOptions`를 재사용한다. 표현 컴포넌트는 각각 `_pages/product-list`와 `_pages/cart`에 두고 서로 직접 import하지 않는다. 여러 페이지에서 같은 마크업과 상호작용을 실제로 공유하는 독립 블록이 생기기 전까지 widgets 레이어는 도입하지 않는다.

#### 2026-09-02 — 상품 카드 통일로 widgets 도입

홈·`/products`·`/cart` 전체상품 피드의 상품 카드 형식을 통일했다. 세 화면은 상품 정보, 할인·평점·배송 표시, 썸네일 안의 위시리스트·장바구니 행위를 같은 마크업으로 공유한다. `ProductCard`는 여러 페이지에서 재사용되는 독립 UI 블록이 되었으므로 `widgets/product-card/ui`로 이동한다.

`ProductCard`는 product·cart·wishlist 엔티티를 조합한다. 이를 `entities/product/ui`에 두면 product 엔티티가 같은 레이어의 cart·wishlist 엔티티를 참조하므로 cross-slice 의존이 생긴다. widget에 두면 `_pages → widgets → entities/shared` 방향을 유지하면서 상품 표현과 사용자 행위를 한 경계에 응집할 수 있다. 페이지별 heading 단계는 `headingLevel`로 주입하고, 카드 구조를 반영하는 스켈레톤도 같은 widget에 둔다.

상품 피드 전체는 공용 widget으로 만들지 않는다. `/products`는 URL 검색·필터·정렬과 목록 갱신 상태를 소유하고, `/cart` 피드는 고정 조건과 장바구니 탐색 문맥을 소유하므로 각 `_pages`에 유지한다. 각 페이지는 조회와 피드 문맥을 담당하고 공용 `ProductCard`와 `ProductCardSkeleton`만 조합한다.

#### _pages — ✅

`_pages`를 쓸지 말지가 가장 헷갈렸던 결정이다. 현재 `app/_components/`에 co-locate된 구조가 이미 잘 동작하고 있어서 "로직은 다른 데서 충분히 만들 수 있는 것 같은데 차이를 모르겠다"는 고민이 있었다.

_pages를 만드는 것과 안 만드는 것의 핵심 차이:
- **_pages 있음**: FSD 의존 규칙이 페이지에도 적용 → `_pages/home` ↔ `_pages/products` 직접 import 금지, 상위→하위 방향 보장
- **_pages 없음**: `app/_components/`에 두면 FSD 규칙 바깥 → 자유롭지만 구조적 보장 없음

의존 규칙을 페이지까지 일관 적용하는 게 이번 과제 취지에 맞다고 판단해서 _pages를 사용하기로 결정. Next.js App Router에서의 `_pages` 사용은 FSD 공식 문서 권장 패턴이기도 하다.

#### _app — ❌

실무에서 `_app` FSD 레이어를 따로 만드는 경우는 드물다. Next.js에서는 `app/layout.tsx`, `app/providers.tsx`가 이미 app 역할을 하고 있고, 별도 레이어로 분리할 실익이 없다. 권장 패턴을 우선하고 싶어서 빼기로 결정.

#### entities에 CUD 행위(addItem, toggle)를 두는 것이 타당한가?

cart와 wishlist store는 `addItem`, `removeItem`, `toggle` 등 상태 변경 행위를 포함한다. "entities는 읽기 전용 비즈니스 모델만 담아야 하고, 유저 인터랙션이 있는 로직은 features로 보내야 하는 게 아닌가?"라는 고민이 있었다.

architecture-review 스킬의 store 소유권 판단 기준으로 분석한 결과:

**기준 1: "여러 feature가 공유하는 도메인 상태면 entity 소유가 타당할 수 있다"**

| store | 사용처 | 갱신 주체 |
|-------|--------|-----------|
| cartStore | HeaderNav(읽기), HomeClient(addItem), ProductListContent(addItem), ProductDetailContent(addItem), CartDialog(읽기+removeItem) — 5곳 | 여러 페이지에서 분산 갱신 |
| wishlistStore | HeaderNav(읽기), HomeClient(toggle), ProductListContent(toggle), ProductDetailContent(toggle) — 4곳 | 여러 페이지에서 분산 갱신 |

둘 다 앱 전역에서 공유되는 도메인 상태이고, 하나의 사용자 행위에서만 쓰이는 것이 아니므로 entity 소유가 타당하다.

**기준 2: FSD에서 features = "사용자에게 가치를 주는 단일 행위"**

`addItem(id)`은 **단일 도메인(cart)의 상태 변경**이지, 여러 도메인을 조합하는 사용자 시나리오가 아니다. 만약 addItem을 features로 옮기면:

- `entities/cart`에는 `items` 데이터만 남고 행위가 비게 됨
- `features/cart`가 entities/cart의 상태를 외부에서 조작하는 구조가 됨
- Zustand의 장점(상태+행위 응집)이 깨짐
- "이 상태를 누가 바꿀 수 있는가?"에 답하려면 entity가 아니라 feature를 봐야 함

**결론**: entities에 CUD가 있는 것 자체는 문제가 아니다. 핵심 기준은 "자기 도메인만 건드리는가 vs 여러 도메인을 조합하는가"이다. cartStore.addItem과 wishlistStore.toggle은 자기 도메인만 건드리므로 entities가 타당하고, CartDialog는 cart + product 두 엔티티를 조합하므로 features가 타당하다.

#### entities 슬라이스 — product / cart / wishlist 분리

cart와 wishlist를 합칠지 분리할지 고민했다. 둘 다 "사용자 선택"이라는 공통점이 있어서 합치는 것도 가능하지만:

| 관점 | 합치기 | 분리 |
|------|--------|------|
| **FSD 원칙** | 같은 슬라이스면 내부 자유 협력 | 같은 레이어 슬라이스 간 import 금지 → 독립성 보장 |
| **도메인** | 둘 다 "사용자 선택" | cart는 구매 흐름, wishlist는 북마킹 — 비즈니스 목적이 다름 |
| **삭제 시나리오** | wishlist 제거 시 cart 코드까지 건드려야 함 | wishlist 폴더만 삭제하면 끝 |

과제 5단계 삭제 시나리오에서 "위시리스트 제거 시 삭제할 파일이 한 곳에 응집"되어야 한다. 분리해야 그걸 증명할 수 있으므로 분리를 선택.

### 허용/금지 Import 예시

```
✅ 허용
_pages/home       → widgets/product-card, entities/product, shared/ui
_pages/product-list → widgets/product-card, entities/product, shared/ui
widgets/product-card → entities/product, entities/cart, entities/wishlist, shared/lib
features/cart      → entities/cart, entities/product, shared/ui
entities/product   → shared/lib, shared/ui
entities/cart      → shared/lib

❌ 금지
entities/product   → entities/cart       (같은 레이어 cross-slice)
entities/cart      → features/cart       (하위 → 상위 역방향)
shared/ui          → entities/product    (하위 → 상위 역방향)
```

---

## A — 애매한 파일 결정표

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
|------|--------|--------|-----------|------|
| `types/commerce.ts`의 Product 타입 | `entities/product/model` | `shared/types` 유지 | **entities/product/model** | 아래 상세 참고 |
| `types/commerce.ts`의 HomeResponse | `entities/product/model` | `_pages/home/api` | **_pages/home/api** | 아래 상세 참고 |
| `types/commerce.ts`의 ApiErrorResponse | `entities/product/model` | `shared/api` | **shared/api** | 도메인 무관 공통 에러 타입 |
| `homeQueries` | `entities/product/api` | `_pages/home/api` | **_pages/home/api** | 아래 상세 참고 |
| `CartDialog` | `entities/cart/ui` | `features/cart/ui` | **features/cart/ui** | 레이어 선택 근거의 features 항목 참고 |
| `ProductCard` | `entities/product/ui` | `widgets/product-card/ui` | **widgets/product-card/ui** | 홈·상품 목록·장바구니 피드가 같은 마크업과 cart·wishlist 행위를 공유한다. 여러 엔티티의 조합은 widget에서 담당하고 페이지별 heading 단계만 prop으로 주입 |
| `CategoryOption` / `CATEGORY_OPTIONS` | `entities/product/model` | `_pages/products/lib` | **entities/product/model** | 아래 상세 참고 |

#### commerce.ts 분해 — 도메인별 분해(A) vs shared 유지(B) vs 일부만 분해(C)

세 가지 선택지를 검토했다:

- **A. 도메인별 분해** — `entities/product/model`, `entities/cart/model` 등으로 분산. 타입 소유자가 명확, 응집 ↑
- **B. shared/types에 유지** — 간단하지만 모든 entities가 shared에 의존. "이 타입의 소유자가 누구인가?"에 답할 수 없음
- **C. 일부만 분해** — Product만 entities로, 나머지 shared. 기준이 애매해질 위험

**A를 선택한 이유**: shared/types에 Product 타입을 두면 entities/product가 자기 도메인 타입의 소유권을 shared에 넘기는 셈이다. 타입을 수정하려면 entities가 아니라 shared를 건드려야 하니까 응집도가 깨진다.

다만 A를 선택하면서 "규칙이 너무 산재하는 게 아닌가?"라는 우려가 있었다. product 관련 타입을 model과 api 세그먼트로 세분화하면 파일이 흩어질 수 있기 때문. 이에 대해 FSD 공식 문서의 가이드를 참고했다:

> "Do not create all segments from the start; begin with `ui` and `model`, and move network calls into `api` when it makes sense."

슬라이스가 작으므로 model 세그먼트 하나에 타입을 모두 두기로 결정. 커지면 그때 api 세그먼트로 분리.

#### 타입 분배 결과

| 타입 | 배치 | 이유 |
|------|------|------|
| `Product`, `SizeValue`, `CategoryId`, `Category`, `CATEGORY_IDS` | `entities/product/model` | product 도메인 본질 |
| `ProductSort`, `PRODUCT_SORTS`, `CategoryOption`, `CATEGORY_OPTIONS`, `ProductListQuery`, `ProductListResponse` | `entities/product/model` | product 조회 파라미터. `CategoryOption`은 `CategoryId`에서 파생되는 UI 필터용 확장 타입이지만, 소유자는 여전히 product 도메인. 슬라이스가 작으므로 세그먼트 분리 불필요 |
| `HomeResponse` | `_pages/home/api/types.ts` | 홈 전용 집계 응답. Category, CategoryId, Product를 참조하므로 `_pages → entities` 방향으로 import. 아키텍처 리뷰 후 이동 |
| `ApiErrorResponse`, `MockApiScenario` | `app/api/_data/types.ts` | Route Handler 전용 타입. FSD 레이어 밖에 잔류하되 소비자도 Route Handler뿐이므로 역방향 의존 없음 |

#### homeQueries — entities/product vs _pages/home

homeQueries가 반환하는 데이터를 분석한 결과:

```ts
{ banner, categories, categoryThumbnails, popularProducts, newProducts }
```

배너, 카테고리 썸네일 같은 건 product 도메인이 아니라 **홈 페이지 전용 집계 데이터**다. `entities/product`에 넣으면 product entity가 배너를 알게 되는 셈이다.

`_pages/home/api`에 배치. 홈에서만 쓰이고, 상품 도메인과 무관한 데이터가 섞여 있으니까.

---

## D — 상태 분류표

> 폴더를 옮기면서 Source of Truth는 바뀌지 않는다.

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 이동 후에도 중복 저장하지 않는 방법 |
|------|----------------|---------------------|------------|-----------------------------------|
| 상품 조회 결과 | 서버 / TanStack Query 캐시 | `entities/product/api` | _pages/home, _pages/product-list, _pages/product-detail | Query 캐시가 유일한 저장소. Zustand에 복사하지 않음 |
| 홈 집계 데이터 (배너, 카테고리) | 서버 / TanStack Query 캐시 | `_pages/home/api` | _pages/home | homeQueries가 관리. product entity와 분리 |
| 검색·카테고리·정렬·페이지 | URL / nuqs | `_pages/product-list/lib` (useProductSearchParams) | _pages/product-list | URL이 유일한 저장소. useState에 동기화하지 않음 |
| 장바구니 (id + quantity) | Zustand (클라이언트) | `entities/cart/model` | features/cart, widgets/product-card, _pages의 장바구니·상품 상세 UI | id+quantity만 저장. 상품 정보는 렌더 시 Query 캐시에서 조회 |
| 위시리스트 (id Set) | Zustand (클라이언트) | `entities/wishlist/model` | widgets/product-card, HeaderNav, 상품 상세 UI | id만 저장 |
| Dialog 열림 여부 | React 로컬 상태 | 해당 UI 컴포넌트 | 해당 컴포넌트만 | 컴포넌트 수명과 동일 |

---

## I — Interface (Public API)

### 결정: Public API 미사용 (직접 경로 import)

```ts
// 직접 경로로 import
import type { Product } from '@/entities/product/model/types';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
```

### barrel file과 Public API의 차이

- **barrel file**: 경로를 줄이려고 내부를 습관적으로 재수출하는 파일. 경계 의도가 없고 `export *`가 쌓이면 이름 충돌·순환 의존·번들 비용만 남는다.
- **Public API**: "외부가 알아도 되는 것은 이것뿐"이라는 **계약**. 같은 `index.ts`라도 무엇을 숨기려고 만들었는지가 다르다.

### 미사용을 선택한 이유

현재 슬라이스 규모가 파일 1~3개로 매우 작다. 이 상태에서 index.ts를 만들면:

- 숨길 구현 세부가 없는 경우: entities/cart는 cartStore.ts 하나뿐이라 Public API가 곧 내부 그 자체
- 관리 비용만 늘어나는 경우: 파일 추가/삭제할 때마다 index.ts도 함께 수정해야 함
- barrel file로 전락할 위험: 계약 의도 없이 습관적으로 `export *` 하는 파일이 될 가능성

### 전환 기준

슬라이스가 커져서 아래 조건 중 하나라도 해당하면 Public API 도입을 검토한다:

- 슬라이스 내 파일이 5개 이상으로 늘어나 외부에 노출할 것과 숨길 것의 구분이 필요할 때
- 외부에서 내부 세그먼트 구조 변경에 영향받는 import가 3곳 이상일 때

---

## O — Optimization

### TanStack Query 캐시 정책

폴더를 옮긴다고 캐시 전략이 바뀔 이유는 없다. 5주차에서 근거를 갖고 설정한 정책을 유지하되, 홈 staleTime만 조정한다.

| 쿼리 | staleTime | gcTime | 변경 | 이유 |
|------|-----------|--------|------|------|
| **홈** (`home`) | ~~5분~~ → **1분** | 10분 | ✅ 변경 | 5분은 너무 김. 인기 상품·신상품이 갱신되어도 5분간 반영 안 됨. 1분이면 캐시 이점을 누리면서 최신 데이터도 적절히 반영 |
| **상품 목록** (`products`) | 0 | 기본(5분) | 유지 | 검색·필터·페이지 조합마다 다른 결과 → 항상 fresh 요청 |
| **상품 상세** (`products/detail`) | 0 | 10분 | 유지 | 최신 가격 보장. gcTime 10분은 장바구니에서 캐시 조회용 (5주차에서 id+quantity만 저장, 상품 정보는 렌더 시 캐시에서 조회하는 구조) |

### 로딩·에러 경계 범위

에러 처리 경계 섹션에서 결정 완료:
- 로딩: 컴포넌트 단위 `<Suspense>` — 헤더 유지, 콘텐츠만 fallback
- 에러: route segment `error.tsx` — useSuspenseQuery가 던진 에러를 catch

### 이번 주에 하지 않을 최적화

| 최적화 | 하지 않는 이유 |
|--------|---------------|
| 상품 목록 hover prefetch | 현재 구현에 없고 리팩토링 범위 밖. 캐시 구조 안정 후 별도 PR |
| React.lazy 코드 스플리팅 | 번들 크기가 문제되는 시점에 검토. 현재는 과도 |
| next/image 이미지 최적화 | 기능 추가에 해당. 구조 변경과 섞지 않음 |

---

## 에러 처리 경계

### 기준: 5xx → Error Boundary 전파, 4xx·빈 결과 → 인라인 처리

5xx는 서버 장애라 화면 전체를 신뢰할 수 없으므로 Error Boundary로 전파, fallback UI를 보여준다. 4xx·빈 결과는 나머지 UI가 정상이므로 해당 영역만 에러 표시하고 전체 새로고침 없이 재시도할 수 있게 한다.

### 에러 분류표

| 실패 유형 | 처리 위치 | Error Boundary로 전파하는가 | 사용자 UI | 재시도 방법 | 이 경계를 선택한 이유 |
|-----------|-----------|---------------------------|-----------|------------|----------------------|
| 상품 목록 조회 실패 (5xx) | `_pages/product-list` 인라인 | ❌ (useQuery 유지) | 컴포넌트 인라인 에러 메시지 + 재시도 버튼 | `refetch()` 버튼 또는 검색·필터 변경으로 재요청 | `placeholderData: keepPreviousData`가 필요하므로 useSuspenseQuery 전환 불가. useQuery의 isError 분기로 인라인 처리하고 `refetch`로 전체 새로고침 없이 재시도. route `error.tsx`는 예상 밖 렌더링 오류용 fallback |
| 홈 조회 실패 (5xx) | `_pages/home` | ✅ useSuspenseQuery가 자동 throw | `error.tsx` fallback | `reset()` | 배너·카테고리·상품이 모두 한 API에서 오므로 부분 표시가 의미 없음 |
| 상품 상세 조회 실패 (5xx/404) | `_pages/product-detail` | ✅ useSuspenseQuery가 자동 throw | 기존 `error.tsx` — 다시 시도 + 목록으로 돌아가기 | `reset()` 또는 목록 이동 | 상품 하나의 조회 실패이므로 상세 영역 전체를 fallback으로 대체 |
| 잘못된 검색 조건 (4xx) | `_pages/product-list` 인라인 | ❌ | 해당 없음 — 현재 nuqs `parseAsStringLiteral`로 유효하지 않은 파라미터를 런타임에 차단하고 있어 잘못된 조건이 API까지 도달하지 않음 | — | URL 파라미터 검증을 클라이언트에서 이미 처리. 향후 사용자 직접 입력(자유 텍스트 검색)이 추가되면 인라인 에러 표시 검토 |
| 예상하지 못한 렌더링 오류 | route segment `error.tsx` | ✅ 자동 (React Error Boundary) | `error.tsx` fallback | `reset()` | 런타임 에러는 예측 불가하므로 가장 가까운 Error Boundary에서 catch |
| 장바구니 행위의 비즈니스 오류 | 해당 없음 | — | — | — | 현재 장바구니는 클라이언트 Zustand만 사용 (서버 통신 없음). 비로그인 로컬 상태이므로 네트워크 실패가 발생하지 않음. 로그인·서버 동기화가 추가되면 features/cart에서 에러 처리 필요 |

### error.tsx 배치

| route segment | error.tsx | 이유 |
|---------------|-----------|------|
| `app/` (루트) | ✅ 추가 필요 | 예상하지 못한 렌더링 오류의 최상위 fallback |
| `app/products/` | ✅ 추가 필요 | 상품 목록 5xx 에러 catch |
| `app/products/[id]/` | ✅ 기존 유지 | 상품 상세 5xx/404 에러 catch |

### useSuspenseQuery 전환

현재 `useQuery` + `isLoading`/`isError` 인라인 분기를 **`useSuspenseQuery` + Suspense/Error Boundary 위임**으로 전환한다.

```tsx
// Before: useQuery — 컴포넌트가 로딩/에러/데이터 3가지 상태를 직접 처리
const { data, isLoading, isError, error } = useQuery(options);
if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage />;
return <ProductList products={data.products} />;

// After: useSuspenseQuery — 경계에 위임, 컴포넌트는 렌더만
const { data } = useSuspenseQuery(options);
return <ProductList products={data.products} />;
```

**전환 이유**: 컴포넌트가 로딩·에러·데이터 세 가지 상태를 직접 분기하면 모든 컴포넌트에 같은 패턴이 반복된다. `useSuspenseQuery`를 쓰면 컴포넌트는 "데이터가 있다"는 전제로 렌더만 하고, 로딩과 에러는 경계(Suspense/Error Boundary)에 위임해서 역할이 분리된다.

**전환 대상과 예외:**

| 컴포넌트 | 전환 | 이유 |
|----------|------|------|
| HomeClient | ✅ useSuspenseQuery | SSR prefetch로 초기 데이터 보장, 로딩/에러 분기 제거 |
| ProductDetailContent | ✅ useSuspenseQuery | 동일 |
| ProductListContent | ❌ useQuery 유지 | `placeholderData: keepPreviousData`가 필요. 페이지네이션 시 이전 데이터를 보여주면서 새 데이터를 fetch하는 UX에 필수인데, `useSuspenseQuery`는 `placeholderData`를 지원하지 않음 |
| CartDialog | ❌ useQuery 유지 | `enabled: !!lastAddedId` 조건부 fetch. useSuspenseQuery는 `enabled`를 지원하지 않음 |

### Suspense fallback 범위 — 컴포넌트 단위 (`<Suspense>`)

route 단위 `loading.tsx`를 쓰면 페이지 전체가 스피너로 대체되어 헤더까지 가려진다. **헤더는 유지하고 콘텐츠만 fallback**으로 대체하기 위해 컴포넌트 단위 `<Suspense>`를 사용한다.

```tsx
// app/products/page.tsx (얇은 셸)
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListContent />
    </Suspense>
  );
}
```

- `loading.tsx`는 사용하지 않음 — 헤더를 가리지 않기 위해
- 각 페이지의 `page.tsx`에서 콘텐츠 컴포넌트를 `<Suspense>`로 감싸는 패턴
- fallback은 스켈레톤 UI 또는 간단한 스피너

### Error Boundary가 잡지 못하는 오류

Error Boundary는 렌더링 중 발생한 오류만 catch한다. 이벤트 핸들러, 비동기 콜백(setTimeout 등)의 오류는 자동으로 잡지 못한다.

현재 이벤트 핸들러에서 발생 가능한 오류:
- 장바구니 담기/제거 (Zustand set): 순수 클라이언트 동기 연산이라 실패하지 않음
- 위시리스트 토글 (Zustand set): 동일

현재는 이벤트 핸들러 에러 처리가 불필요. 서버 통신(주문, 로그인 등)이 추가되면 try-catch + 인라인 에러 상태로 처리.

---

## 삭제 시나리오

FSD 전환 후 목표 구조 기준으로 분석. 기능별 응집이 됐는지 확인하는 리트머스 테스트.

### 시나리오 1: "위시리스트 기능을 통째로 제거한다면"

**삭제할 파일:**

| 파일 | 레이어/슬라이스 |
|------|----------------|
| `entities/wishlist/` 폴더 전체 | entities/wishlist |

삭제 대상이 한 폴더에 응집. grep 없이 `entities/wishlist/`만 삭제하면 된다.

**수정이 필요한 파일 (위시리스트를 소비하는 곳):**

| 파일 | 수정 내용 |
|------|-----------|
| `widgets/product-card/ui/ProductCard.tsx` | 위시리스트 상태 구독과 토글 버튼 제거 |
| `_pages/product-detail/ui/ProductDetailContent.tsx` | 위시리스트 토글 버튼 제거 |
| `app/_components/HeaderNav.tsx` | 위시리스트 개수 표시 제거 |

수정 대상이 여러 곳에 흩어져 있지만, 이건 소비자 측의 참조 제거이므로 정상이다. 핵심은 위시리스트의 구현 코드(store, 타입, 로직)가 한 곳에 모여 있는가이며, `entities/wishlist/` 하나로 응집되어 있다.

### 시나리오 2: "신상품 뱃지를 상품 카드에 추가한다면"

**터치할 파일:**

| 파일 | 수정 내용 | 레이어 |
|------|-----------|--------|
| `entities/product/model/` 또는 `lib/` | `isNewProduct(createdAt)` 뱃지 판단 로직 추가 | entities |
| `widgets/product-card/ui/ProductCard.tsx` | 공용 카드에 뱃지 렌더링 | widgets |

- 타입 변경 불필요 — `Product`에 이미 `createdAt: string`이 존재
- 도메인 로직(`isNewProduct`)은 `entities/product` 안에서, UI 적용은 `widgets/product-card`에서 담당한다
- 의존 방향도 정상: `widgets`(상위) → `entities/product`(하위)

---

## 동작 기준선 (0단계)

전환 전 수동 확인 완료 (2026-07-31). `pnpm typecheck` 통과, `pnpm test` 70개 통과.

| # | 항목 | 결과 |
|---|------|------|
| 1 | 홈 정상 표시 (배너, 카테고리, 인기상품, 신상품) | ✅ |
| 2 | 홈 빈 상태 (`?scenario=empty`) | ✅ |
| 3 | 홈 에러 상태 (`?scenario=error`) | ✅ |
| 4 | 상품 목록 정상 표시 | ✅ |
| 5 | 검색 동작 | ✅ |
| 6 | 카테고리 필터 | ✅ |
| 7 | 정렬 변경 | ✅ |
| 8 | 페이지네이션 | ✅ |
| 9 | URL 복사 → 새 탭에서 열기 (필터 상태 유지) | ✅ |
| 10 | 뒤로/앞으로 가기 | ✅ |
| 11 | 장바구니 담기 → 헤더 개수 반영 | ✅ |
| 12 | 위시리스트 토글 → 헤더 개수 반영 | ✅ |
| 13 | 페이지 이동 중 장바구니·위시리스트 상태 유지 | ✅ |
| 14 | 새로고침 후 URL 상태 유지 (장바구니·위시리스트는 초기화 정상) | ✅ |

---

## 마이그레이션 계획

### 원칙

- **바텀업**: 하위 레이어(shared)부터 옮겨야 상위에서 import 경로만 바꾸면 된다
- **구조 이동과 동작 변경을 분리**: 1~5단계는 import 경로 변경만, 6단계에서 useSuspenseQuery 전환
- **매 단계마다 검증**: typecheck로 깨진 import 확인, 기존 테스트 통과 여부 확인

### 단계별 계획

| 단계 | 작업 | 검증 |
|------|------|------|
| **0** | RFC 커밋 (코드 변경 전) | — |
| **1** | `shared` — ui(Dialog, Select, icons), lib(format), api(에러 타입) | `pnpm typecheck` + `pnpm test` (Dialog/Select 테스트 import 경로 확인) |
| **2** | `entities/product` — model(타입·상수), api(productQueries) | `pnpm typecheck` |
| **3** | `entities/cart`, `entities/wishlist` — model(store) | `pnpm typecheck` |
| **4** | `features/cart` — ui(CartDialog) | `pnpm typecheck` |
| **5** | `_pages` — home, product-list, product-detail (페이지 컴포넌트 + 훅 이동) | `pnpm typecheck` |
| **6** | `useSuspenseQuery` 전환 + `error.tsx` 추가 + `<Suspense>` 적용 | `pnpm typecheck` + `pnpm test` + 수동 에러 재현 (`?scenario=error`) |
| **7** | 빈 디렉토리·미사용 파일 정리, 세그먼트명 수정 (`hooks` → `lib`) | `pnpm typecheck` + `pnpm build` |

### 테스트 전략

- 새 테스트 작성 불필요 — 구조 이동은 기존 테스트 통과로 검증 충분
- 기존 테스트(Dialog, useSelect)는 `shared/ui/`로 co-locate 이동 → import 경로 수정 필요
- API route 테스트 3개는 전환 범위 제외이므로 그대로 유지
- 6단계(useSuspenseQuery) 전환은 수동 에러 재현으로 검증 (`?scenario=error`, `?scenario=empty`)

### 단계별 검증 결과

| 단계 | 커밋 | typecheck | lint | build | 비고 |
|------|------|-----------|------|-------|------|
| **0** | `4a974ae` | — | — | — | RFC 작성 |
| **1** | `b801e78` | ✅ | ✅ | — | shared 이동 완료 |
| **2** | `5433bc0` | ✅ | ✅ | — | entities/product 이동. route.ts, commerce.ts 데이터 파일도 import 수정 필요했음 |
| **3** | `e443b28` | ✅ | ✅ | — | cart/wishlist store 이동 |
| **4** | `7f8dfb1` | ✅ | ✅ | — | CartDialog → features/cart |
| **5** | `8d6f3c5` | ✅ | ✅ | — | _pages 이동 + homeQueries staleTime 5분→1분 |
| **6** | `32bf919` | ✅ | ✅ | — | useSuspenseQuery 전환. ProductListContent는 `placeholderData` 필요로 useQuery 유지 |
| **7** | — | ✅ | ✅ | ✅ | 빈 디렉토리 6개 삭제, `hooks` → `lib` 세그먼트명 수정 |
| **8** | — | ✅ | ✅ | ✅ | 아키텍처 리뷰 후 서비스·mock 데이터·타입 이동 (아래 상세) |

### 8단계 — 아키텍처 리뷰 후 역방향 의존 해소

`architecture-review` 스킬로 POST_MIGRATION 점검을 받은 결과, FSD 레이어 간 역방향 의존 2건이 발견되었다.

| 지적 | 현재 | 문제 |
|------|------|------|
| `entities/product/api` → `app/api/_data/productService` | entities → app | 하위가 상위를 import |
| `_pages/home/api` → `app/api/_data/homeService` | _pages → app | 하위가 상위를 import |

**원인**: 서비스 함수(`productService`, `homeService`)와 mock 데이터(`commerce.ts`)가 `app/api/_data/`에 남아 있었으나, `queryFn`이 이를 직접 호출하면서 entities·_pages에서 app 방향으로 import가 발생.

**해소 방법**: 서비스 함수와 mock 데이터를 FSD 레이어 안으로 이동.

| 파일 | 이동 전 | 이동 후 | 방향 |
|------|---------|---------|------|
| `commerce.ts` (mock 데이터) | `app/api/_data/` | `entities/product/api/` | product 도메인 데이터 |
| `commerce.test.ts` | `app/api/_data/` | `entities/product/api/` | 테스트 co-locate |
| `productService.ts` | `app/api/_data/` | `entities/product/api/` | product 조회·필터·정렬 |
| `homeService.ts` | `app/api/_data/` | `_pages/home/api/` | 홈 전용 데이터 가공 |
| `waitForMockApi` | `commerce.ts`에서 분리 | `app/api/_data/mock.ts` | Route Handler 전용 mock 유틸 |
| `HomeResponse` | `types/commerce.ts` | `_pages/home/api/types.ts` | 홈 도메인 응답 타입 |
| `ApiErrorResponse`, `MockApiScenario` | `types/commerce.ts` | `app/api/_data/types.ts` | Route Handler 전용 |

이동 후 `types/commerce.ts`, `constants/` 빈 디렉터리 삭제.

**검증**: `pnpm typecheck` 통과, `pnpm test` 70개 통과.

---

## 아키텍처 리뷰 결과

`architecture-review` 스킬로 POST_MIGRATION 점검을 2회 실시.

### 1차 리뷰 — 지적 4건

| ID | 심각도 | 내용 |
|---|---|---|
| AR-01 | High | `entities` → `app/api/_data/productService`, `_pages` → `app/api/_data/homeService` 역방향 의존 |
| AR-02 | Medium | `types/commerce.ts`가 FSD 밖에서 entities 타입을 참조 |
| AR-03 | Low | `PRODUCT_LIST_DEFAULTS`의 소유권이 app과 entities에 분산 |
| AR-04 | Low | Route Handler가 entities를 직접 참조 (`app → entities` 방향이므로 위반 아님) |

### 수용·반려 결정

| 지적 ID | 결정 | 근거 |
|---|---|---|
| AR-01 | 수용 | 서비스·mock 데이터를 FSD 레이어로 이동하여 역방향 제거 |
| AR-02 | 수용 | `HomeResponse` → `_pages/home/api/types.ts`, `ApiErrorResponse`·`MockApiScenario` → `app/api/_data/types.ts`로 분리 후 `types/commerce.ts` 삭제 |
| AR-03 | 수용 | AR-01 해소 시 자동 해결 — `PRODUCT_LIST_DEFAULTS`가 같은 슬라이스 내 `productService.ts`에 위치 |
| AR-04 | 반려 | `app → entities`는 FSD 방향 정상. Route Handler가 서비스를 소비하는 구조는 적절 |

### 2차 리뷰 — 승인

AR-01~03 해소 후 재점검. 역방향 import 0건, cross-slice 의존 0건, 순환 의존 0건으로 승인.

---

## FSD 이해 확인 질문

### 1. `ProductCard`가 찜 버튼을 직접 import하면 어떤 의존 규칙을 어기며, 어디에서 조합해야 하는가?

`ProductCard`를 `entities/product`에 두고 wishlist를 직접 참조하면 같은 레이어 간 의존(cross-slice import)이 생겨 슬라이스 독립성이 깨집니다.

2026-09-02에 홈·상품 목록·장바구니 피드의 카드 마크업과 행위를 통일하면서 `ProductCard`를 `widgets/product-card`에 배치했습니다. widget은 product·cart·wishlist 엔티티를 조합하고, 각 `_pages`는 공용 카드를 가져와 페이지 문맥에 맞는 heading 단계만 주입합니다. 이 구조는 `_pages → widgets → entities` 의존 방향을 유지합니다.

### 2. 한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가?
`useProductSearchParams`는 URL 파라미터를 다루는 페이지 전용 로직이라 feature보다는 `_pages/product-list/lib`에 두었습니다. 아직 여러 도메인을 엮는 독립적인 기능으로 보기 어렵고, 현재 사용처도 하나뿐이라 사용처 가까이에 두는 편이 응집도 측면에서 적절하다고 판단했습니다. 

이후 다른 페이지에서도 재사용하게 되면 그때 feature로 리팩토링하는 것이 자연스럽다고 생각합니다.

### 3. `formatPrice`는 항상 `shared/lib`인가? 통화·회원 등급·상품 정책이 포함되면 결정이 어떻게 달라지는가?

`formatWon`은 도메인과 무관한 원화 포맷 함수이므로 `shared/lib`에 둡니다. 여기에 할인이나 상품별 가격 정책이 포함되면 비즈니스 로직이 되므로 해당 도메인으로 옮깁니다. 여기서 배치 기준은 함수의 변경 이유라 생각했습니다.

### 4. 두 feature가 협력해야 할 때 직접 import하지 않고 어떤 상위 레이어에서 조합했는가?

현재 features에는 cart 하나뿐이라 feature 간 협력하는 경우는 아직 없습니다. 하지만 CartDialog를 어디에 둘지 결정하면서 비슷한 고민을 거쳤습니다. CartDialog는 cart store에서 담긴 상품 id를 가져오고, product query로 해당 상품의 이름/가격/이미지를 조회하여 보여줍니다. cart와 product 두 엔티티의 데이터를 동시에 사용하는 조합 로직인데, 이를 한쪽 entity에 넣으면 다른 entity에 대한 의존이 생겨 슬라이스 격리가 깨진다고 생각했습니다.

그래서 상위 레이어인 `features/cart`에서 둘을 조합하도록 배치했습니다.

이후 위시리스트에 담긴 상품을 한 번에 장바구니로 옮기기 등의 기능이 생겨 feature가 늘어날 경우 wishlist feature와 cart feature가 서로를 알아야 하는 상황이 될 경우 feature끼리 직접 참조하지 않고 `_pages`나 `widgets` 같은 상위 레이어에서 조합하려 합니다.

### 5. 폴더 이동 후에도 TanStack Query 데이터와 Zustand 데이터를 서로 복사하지 않은 이유는 무엇인가?

폴더 구조가 바뀌어도 데이터의 소유권까지 바뀌는 것은 아니라고 생각했습니다. 상품 데이터의 원본은 TanStack Query 캐시에 두고, Zustand에는 장바구니 상태에 필요한 `productId`와 `quantity`만 저장했습니다.

상품명이나 가격까지 Zustand에 복사하면 같은 데이터가 Query 캐시와 Zustand 두 곳에 존재하게 됩니다. 이후 가격이 변경되었을 때 두 값이 달라질 수 있고, 어느 쪽을 기준으로 해야 하는지도 모호해집니다. 따라서 CartDialog에서도 상품 정보는 Query 캐시에서 조회하고, Zustand는 장바구니에 어떤 상품이 몇 개 담겼는지만 관리하도록 역할을 분리했습니다.


### 6. barrel file과 Public API는 무엇이 다른가? 내 프로젝트에서는 어느 쪽을 선택했고 그 의도는 무엇인가?

배럴 파일은 import 경로를 단순화하기 위한 것이고, Public API는 외부에 공개할 대상을 제한하는 경계입니다.

제 프로젝트는 슬라이스당 파일 수가 적어 둘 다 도입하지 않았습니다. 현재는 index.ts가 오히려 불필요한 한 단계가 된다고 판단했고, 슬라이스가 커져 공개 범위를 관리할 필요가 생기면 Public API를 도입할 계획입니다.
