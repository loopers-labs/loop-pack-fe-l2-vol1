# RFC: 커머스 FSD 아키텍처 전환 (6주차)

> 5주차까지 만든 커머스의 동작을 보존하면서, "이 파일은 어디에 두어야 하는가"와 "이 변경은 어디까지 퍼지는가"에 답할 수 있는 FSD 구조로 재배치한다.

**작성 순서 원칙:** 이 문서는 파일을 옮기기 **전에** 커밋한다. 정답 폴더 트리를 복사하는 문서가 아니라, 내 코드에서 내린 결정과 그 근거를 남기는 문서다.

**에러 전략의 핵심 원칙 — 구조 이동과 에러 재설계를 커밋으로 분리한다:** 이번 주 산출물은 두 개의 독립 커밋으로 나눈다.
- **커밋 1 (구조 이동)**: 폴더만 FSD로 재배치하고 **에러 처리 동작은 5주차 인라인 방식을 100% 보존**한다. 이 커밋은 동작이 바뀌지 않는다(behavior-neutral).
- **커밋 2 (에러 전략 재설계)**: `error.tsx` 경계를 도입해 **5xx는 경계로, 4xx·빈 결과는 인라인**으로 나눈다. 이건 의도적 동작 변경이며, 근거는 [week06-error-handling-research.md](./week06-error-handling-research.md)에 교차검증했다.

> **왜 나누는가:** 과제 규칙은 "구조 변경과 기능 변경을 같은 커밋에 섞지 말라"고 한다. 이 규칙이 요구하는 건 *커밋 분리*이지 *에러 재설계 생략*이 아니다. 구조 이동을 무해하게 유지하면 롤백·리뷰가 쉽고, 에러 전략은 별도 커밋에서 before/after가 명확해진다.

---

## 0. 동작 기준선 (마이그레이션 전 확인)

폴더를 옮기기 전, 마이그레이션 전 원래 구조(`Harper9808` 브랜치)에서 확인한 결과를 기록한다. 이동 후 같은 시나리오로 재확인한다.

- **`pnpm check` 통과** (test·lint·typecheck·build 전부) — 2026-07-31 확인.
- **수동 QA**:
  - 홈: 배너·카테고리·인기·신상품 정상 렌더 / 빈 상태(`/api/home?scenario=empty`) / 에러 상태
  - 상품 목록: 검색·카테고리·정렬·페이지네이션 동작, URL 공유·새로고침·뒤로/앞으로로 조건 복원, 범위 밖 page(`/products?page=999`) 마지막 페이지 보정
  - 담기·찜 토글 후 페이지 이동 시 Zustand 상태·헤더 카운트 유지, 홈↔목록 상태 동기화
- **에러 상태 재현 방법 주의**: 앱의 `fetchHome`/`fetchProducts`는 `scenario`를 API에 전달하지 **않는다**(요청 URL에 `scenario` 파라미터를 싣지 않음, grep 확인). 따라서 에러 UI는 UI 조작으로 트리거되지 않으며, 검증하려면 fetch를 임시로 실패시켜야 한다(코드에서 요청 URL에 `?scenario=error`를 붙이거나 네트워크 차단). mock 자체는 `scenario=error`→500, `scenario=unknown`·잘못된 입력→400을 낸다(`src/app/api/*/route.ts`).

---

## R — Requirements

### 보존해야 할 기존 동작 (5주차까지)

- **홈**: 배너·카테고리·인기 상품·신상품 표시, 로딩/에러/빈 상태 구분, 에러 시 재시도
- **상품 목록**: 검색·카테고리·정렬·페이지네이션, URL 공유·새로고침·뒤로/앞으로 가기로 조건 복원, 잘못된 page 값(0·음수·범위 초과) 보정
- **장바구니·위시리스트**: 비로그인 로컬 상태, 헤더 개수 파생, 페이지 이동 중 유지, 홈·목록 간 상태 동기화
- **4주차 산출물**: Dialog(Compound), Select(Headless) — 현재 어떤 페이지에서도 렌더되지 않지만 과제 필수 산출물이라 보존
- **재시도 정책**: `providers.tsx`의 `shouldRetry`(4xx 즉시 실패, 5xx·네트워크만 재시도)는 그대로 둔다 — 이 정책 자체가 4xx/5xx를 다르게 다루는 근거의 일부다(에러 리서치 노트 참고).

### 이번 주에 하지 않을 것과 이유

- **`src/common/hooks/*`, `src/common/utils/{readUrlParam,escapeRegExp}.ts`, `src/common/services/httpClient.ts` 이동/삭제 안 함** — grep 전수 확인 결과 활성 Next 앱에서 아무도 참조하지 않고, 이미 마이그레이션 범위 밖인 Vite 잔재(`src/product/*`)에서만 쓰인다. 도메인 무관 제네릭이라 옮긴다면 `shared/lib`이 맞지만, 쓰는 곳 없는 코드를 새 구조에 우겨넣는 것은 FSD가 피하려는 "일단 만들어 둔 폴더"다.
- **죽은 코드(`src/product`, `src/examples`, `src/market`, `src/App.tsx`, `src/main.tsx`) 이번 라운드 삭제 안 함** — 삭제는 구조 이동과 무관한 기능 변경이므로 원한다면 **별도 커밋(커밋 3)**으로 분리한다. 이번 RFC의 두 커밋 범위에는 넣지 않는다.
  - _재제출 정정: 예고한 대로 별도 커밋 `9394f6a3`("chore: 죽은 코드 삭제")에서 이 파일들을 실제로 삭제했다(36개 파일, -1367줄). "이번 라운드 삭제 안 함"은 위 두 커밋(구조 이동·에러 재설계) 범위에 넣지 않는다는 뜻이었고, 삭제 자체는 그 뒤 커밋 3에서 수행됐다._
- **`src/app/api/**`(Route Handler·mock fixture) 이동 안 함** — 과제 지시 범위 제외. 단 응답/도메인 타입은 재배치된 위치에서 그대로 import한다(아래 Interface 절의 백엔드 경계 참고).
- **`processes` 레이어 안 만듦** — 여러 페이지를 넘나드는 다단계 플로우(체크아웃 등)가 아직 없다.
- **포커스 트랩·ARIA(4주차 범위 밖), 제네릭 응답 타입 추상화, 상품 상세 페이지** — 현재 필요 없어 만들지 않는다.

---

## A — Architecture

### 현재 구조에서 실제로 겪는 문제

1. **상품 관련 코드가 5곳에 흩어져 있다** — `src/app/products/`(페이지·필터·페이지네이션), `src/components/commerce/`(카드), `src/lib/commerce/`(조회), `src/store/`(장바구니 상태), `src/types/`(타입). "상품 카드에 뱃지를 추가하려면 어디부터 봐야 하지?"에 즉답할 수 없다.
2. **`ProductCard`가 Zustand store를 직접 import한다** — 상품 "표현"과 "사용자 행위(담기·찜)"가 한 컴포넌트에 묶여, 담기 버튼 문구만 바꾸려 해도 표현 컴포넌트를 건드려야 한다.
3. **장바구니·위시리스트가 하나의 store 파일에 함께 있다** — "위시리스트만 통째로 제거"하려면 store 파일을 부분 수정해야 한다(파일 단위 삭제가 안 됨).

### Before / After 폴더 트리

**Before (발췌):**
```
src/
├── app/{layout.tsx, page.tsx, ProductSection.tsx, providers.tsx, products/*, api/*}
├── components/{commerce/{Header,ProductCard}.tsx, ui/{dialog,select}/*}
├── lib/commerce/{api.ts, queries.ts}
├── store/commerce.ts
├── types/commerce.ts
└── common/{components/Badge.tsx, hooks/*, services/*, utils/*}
```

**After:**
```
src/
├── app/                              # Next 라우팅 전용(얇은 진입점) + mock 백엔드
│   ├── layout.tsx                    # Providers·Header 조합만
│   ├── page.tsx                      # <HomePage/> 렌더만
│   ├── error.tsx                     # 홈 세그먼트 에러 경계 (커밋 2에서 추가)
│   ├── products/
│   │   ├── page.tsx                  # <ProductListPage/> 렌더만
│   │   └── error.tsx                 # 목록 세그먼트 에러 경계 (커밋 2에서 추가)
│   └── api/                          # mock 백엔드 (이동 안 함, import 경로만 갱신)
│       ├── home/route.ts
│       ├── products/route.ts
│       └── _data/commerce.ts
├── _app/
│   ├── providers.tsx                 # QueryClientProvider + NuqsAdapter
│   └── styles/{globals.css, commerce.css}
├── _pages/
│   ├── home/
│   │   ├── ui/{HomePage.tsx, ProductSection.tsx}
│   │   ├── api/{queries.ts(homeQueryOptions), api.ts(fetchHome)}
│   │   └── index.ts
│   └── product-list/
│       ├── ui/{ProductListPage.tsx, ProductFilters.tsx, ProductResults.tsx, Pagination.tsx}
│       ├── model/useProductListQuery.ts
│       └── index.ts
├── widgets/
│   ├── header/{ui/Header.tsx, index.ts}
│   └── product-card/{ui/ProductCardWithActions.tsx, index.ts}
├── features/
│   ├── add-to-cart/{ui/AddToCartButton.tsx, index.ts}
│   └── toggle-wishlist/{ui/ToggleWishlistButton.tsx, index.ts}
├── entities/
│   ├── product/
│   │   ├── ui/{ProductCard.tsx, Badge.tsx}
│   │   ├── model/types.ts            # Product, Category, CategoryId, ProductSort
│   │   ├── api/
│   │   │   ├── types.ts              # HomeResponse, ProductListResponse, ProductListQuery
│   │   │   ├── api.ts                # fetchProducts
│   │   │   └── queries.ts            # productListQueryOptions
│   │   └── index.ts                  # ProductCard + 순수 타입만 공개 (queryOptions·Badge 미공개)
│   ├── cart/{model/store.ts, index.ts}
│   └── wishlist/{model/store.ts, index.ts}
└── shared/
    ├── ui/{dialog/**, select/**}
    ├── api/{apiError.ts, httpClient.ts(fetchJson), types.ts(ApiErrorResponse, MockApiScenario)}
    └── lib/{formatPrice.ts, getPageNumbers.ts}
```

### 사용할 레이어만 선택한 근거

- `_app`·`_pages`·`widgets`·`features`·`entities`·`shared` 6계층을 쓰되, `processes`는 안 만든다(다단계 크로스 페이지 플로우 없음).
- `src/app`은 Next.js 예약 라우팅 디렉터리라 FSD App 레이어와 구분해 `src/_app`·`src/_pages`를 쓴다. `src/pages`는 만들지 않는다(Pages Router로 오인).
- 빈 폴더·미사용 `index.ts`는 만들지 않는다. `entities/cart`·`entities/wishlist`는 `model` 세그먼트만 있으면 충분해 `ui`·`api`를 만들지 않는다.

### 허용 / 금지 import 예시

```
_app → _pages → widgets → features → entities → shared   (상위 → 하위만)
```
- ✅ `features/add-to-cart` → `entities/cart` (상위가 하위)
- ✅ `widgets/product-card` → `entities/product` + `features/add-to-cart` + `features/toggle-wishlist`
- ✅ `_pages/product-list` → `entities/product/api/queries` (세그먼트 직접 경로 — 아래 Interface 참고)
- ❌ `entities/product` → `features/add-to-cart` (하위가 상위 = 역방향)
- ❌ `features/add-to-cart` → `features/toggle-wishlist` (동일 레이어 슬라이스 간 직접 import)
- ❌ `entities/cart` → `entities/wishlist` (동일 레이어)

### 단계별 마이그레이션 계획과 검증 (커밋 1 = 구조 이동)

의존 방향(하위→상위) 순서로 옮겨, 각 단계에서 참조할 하위 레이어가 이미 존재하게 한다. **에러 처리 로직은 이 단계 전체에서 5주차 인라인 방식을 그대로 이식한다(변경 없음).**

1. `shared` 구성(dialog/select 이동, apiError·httpClient·types 생성, formatPrice·getPageNumbers 이동) → `pnpm typecheck`(옛 경로 참조 에러는 이후 단계에서 해소되므로 목록만 확인)
2. `entities/product`(타입·ProductCard·Badge·api 세그먼트) → `pnpm typecheck`
3. `entities/cart`·`entities/wishlist`(store 분리) → `pnpm typecheck`
4. `features/add-to-cart`·`features/toggle-wishlist` → `pnpm typecheck`
5. `widgets/product-card`·`widgets/header` → `pnpm typecheck`
6. `_app`(providers·styles) → `pnpm dev`로 홈 렌더 확인
7. `_pages/home`·`_pages/product-list` → `pnpm dev`로 두 페이지 전체 동작 확인
8. `src/app` 라우팅 정리 + mock 백엔드 import 경로 갱신 + 옛 파일(`src/lib`, `src/store`, `src/types`, `src/components`) 삭제 → **`pnpm check` 전체 통과 → 여기서 커밋 1**

각 단계 후 커밋하지 않고 단계 8에서 구조 변경을 하나의 커밋으로 묶는다. **근거는 husky가 아니다** — 실제 `.husky/pre-commit`은 `lint-staged`(스테이징된 파일에 `eslint --fix`·`prettier --write`)만 돌고 **typecheck는 커밋 게이트가 아니다**(`tsc`는 `pnpm check`에서만 실행). 즉 중간의 typecheck 깨진 상태도 기술적으로는 커밋된다. 하나로 묶는 진짜 근거는 (1) 구조 이동을 **원자적 커밋**으로 만들어 문제 시 통째로 롤백·리뷰가 쉽고, (2) AGENTS.md가 명시한 "커밋 전 typecheck 통과" 정책의 **의도**를 지키려면(실제 훅엔 미구현이라도) `pnpm check`가 통과하는 단계 8이 유일한 안전 지점이기 때문이다. `--no-verify` 우회도 금지다.

### 파일 매핑표

| 현재 위치 | 목표 위치 | 레이어/세그먼트 | 이동/유지 이유 |
| --- | --- | --- | --- |
| `components/ui/dialog/**` | `shared/ui/dialog/**` | shared/ui | 도메인 무관 UI 프리미티브(4주차) |
| `components/ui/select/**` | `shared/ui/select/**` | shared/ui | 도메인 무관 로직 프리미티브 |
| `lib/commerce/api.ts`의 `ApiError` | `shared/api/apiError.ts` | shared/api | 상태 코드 보존은 통신 계층 공통 개념 |
| `lib/commerce/api.ts`의 `fetchJson` | `shared/api/httpClient.ts` | shared/api | entities·`_pages/home` 양쪽이 공유하는 fetch 헬퍼 |
| `types/commerce.ts`의 `ApiErrorResponse`·`MockApiScenario` | `shared/api/types.ts` | shared/api | 도메인 무관 통신/제어 타입 |
| `common/utils/formatPrice.ts` | `shared/lib/formatPrice.ts` | shared/lib | 순수 숫자 포맷 |
| `common/utils/getPageNumbers.ts` | `shared/lib/getPageNumbers.ts` | shared/lib | 페이지 번호 계산, 목록 2곳 재사용 |
| `types/commerce.ts`의 `Product`·`Category`·`CategoryId`·`ProductSort` | `entities/product/model/types.ts` | entities/product | 안정적 도메인 모델 |
| `components/commerce/ProductCard.tsx` | `entities/product/ui/ProductCard.tsx` | entities/product | 행위 제거·`actions` 슬롯화한 순수 표현 |
| `common/components/Badge.tsx` | `entities/product/ui/Badge.tsx` | entities/product | variant 대부분 상품 표시용(`warning`만 범용)·미사용·삭제 후보 — 잠정 배치(아래 결정표) |
| `lib/commerce/api.ts`의 `fetchProducts` | `entities/product/api/api.ts` | entities/product | 상품 조회 능력 |
| `lib/commerce/queries.ts`의 `productListQueryOptions` | `entities/product/api/queries.ts` | entities/product | 상품 조회 능력(캐시 정책 포함) |
| `types/commerce.ts`의 `HomeResponse`·`ProductListResponse`·`ProductListQuery` | `entities/product/api/types.ts` | entities/product | 백엔드·프론트 공유 계약, 레이어 밖(백엔드)이 `_pages`를 역참조하지 않게 하는 배치 |
| `store/commerce.ts`의 `cartIds`·`toggleCart`·`useIsInCart` | `entities/cart/model/store.ts` | entities/cart | 헤더·add-to-cart 양쪽이 읽는 공유 도메인 |
| `store/commerce.ts`의 `wishIds`·`toggleWish`·`useIsWished` | `entities/wishlist/model/store.ts` | entities/wishlist | cart와 분리된 독립 store |
| (신규) | `features/add-to-cart/ui/AddToCartButton.tsx` | features | entities/cart 액션 호출 |
| (신규) | `features/toggle-wishlist/ui/ToggleWishlistButton.tsx` | features | entities/wishlist 액션 호출 |
| (신규) | `widgets/product-card/ui/ProductCardWithActions.tsx` | widgets | entities/product + 두 feature 조합 지점 |
| `components/commerce/Header.tsx` | `widgets/header/ui/Header.tsx` | widgets | cart·wishlist 개수 selector 조합 |
| `app/providers.tsx` | `_app/providers.tsx` | _app | 앱 전역 초기화 |
| `app/{globals,commerce}.css` | `_app/styles/*` | _app | 전역 스타일 |
| `app/page.tsx`(본문) | `_pages/home/ui/HomePage.tsx` | _pages/home | 홈 조합 로직 |
| `app/ProductSection.tsx` | `_pages/home/ui/ProductSection.tsx` | _pages/home | 홈 전용 섹션 |
| `lib/commerce/queries.ts`의 `homeQueryOptions`·`api.ts`의 `fetchHome` | `_pages/home/api/*` | _pages/home | 홈 전용 합성 조회 |
| `app/products/page.tsx`(본문) | `_pages/product-list/ui/ProductListPage.tsx` | _pages/product-list | 목록 조합 로직 |
| `app/products/{ProductFilters,ProductResults,Pagination}.tsx` | `_pages/product-list/ui/*` | _pages/product-list | 이 페이지 전용 UI |
| `app/products/useProductListQuery.ts` | `_pages/product-list/model/useProductListQuery.ts` | _pages/product-list | 이 페이지 전용 URL 상태 훅 |

### 애매한 파일 결정표 (적대적 리뷰 검증 완료)

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 / 리뷰 결과 |
| --- | --- | --- | --- | --- |
| `ProductCard` 조합 지점 | 완전 중복(2곳) | `widgets/product-card` | **widgets/product-card** | 완전 중복은 위시 버튼 순서 변경 하나에도 2곳을 grep해 고쳐야 하는 파편화. 과제가 "widget 또는 page에서 조합"을 명시. 위젯은 파일 2개(구현+index.ts)뿐이라 비용<이득 |
| `ProductCard` 행위 결합 | store 직접 import | `actions` 슬롯 | **actions 슬롯** | entities가 store(다른 도메인)를 알면 역방향 결합. 슬롯으로 표현/행위 분리. 버튼 그룹 정렬 CSS는 명시적 클래스 `.week05-product__actions`로 이관(위치 의존 셀렉터 제거) |
| 장바구니 store | `entities/cart` 독립 store | 한 store에 slice combine | **entities/cart 독립 store** | slice combine은 결합 지점에서 entities끼리 import가 필요해 동일 레이어 규칙 위반. `toggle` 3줄 중복은 shared 추출보다 싸다(추출 시 "위시 폴더만 삭제" 응집성이 깨짐) |
| 상품 목록 queryOptions | `entities/product/api` | `_pages/product-list/api` | **entities/product/api** | "조회 능력의 소유자가 누구인가"가 기준. 상품 목록 조회는 product 엔티티의 조회 능력. 지금 옮기는 비용≈0, 나중(상품 상세의 관련상품 재사용) 비용은 큼 |
| 홈 queryOptions | `entities/product/api` | `_pages/home/api` | **_pages/home/api** | queryKey가 `['home']` 단일 합성 키(배너+카테고리+인기+신상품)라 엔티티 단일 리소스 조회가 아니다. entities로 옮기면 배너까지 아는 오염 발생 |
| `HomeResponse`·`ProductListResponse` | `_pages/*/api` | `entities/product/api` | **entities/product/api** | `_pages`에 두면 mock 백엔드(`route.ts`)가 `_pages`를 역참조. `shared`에 두면 shared가 Product를 역참조. entities가 유일하게 두 방향 위반을 모두 피함. `banner`가 상품 무관 필드인 점은 타협 — 단 이는 **타입 배치**의 타협일 뿐, **런타임 조회 배치**(`homeQueryOptions`는 `_pages/home`)와는 별개다(홈 조회 로직은 여전히 entities 밖) |
| `ProductListQuery` | `_pages/product-list/model` | `entities/product/api` | **entities/product/api** | `fetchProducts`의 파라미터 타입이라 함수와 같은 곳. URL 상태의 `ProductListParams`(전 필드 필수)와는 별개 타입(요청 조립용, 전 필드 옵셔널) |
| `Badge` | `shared/ui` | `entities/product/ui` | **entities/product/ui** (잠정) | variant `discount/new/hot/best/soldout`은 상품 표시용이나 `warning`은 범용이라 완전히 상품 도메인에 닫힌 유니언은 아니다. 다만 현재 **미사용**이라 도메인 결합을 확정할 근거가 약해, 상품 표시 성격이 우세한 점만으로 잠정 `entities/product`에 두고 Public API 미노출 + "삭제 후보" 꼬리표. 실제 소비처가 범용으로 쓰기 시작하면 `shared/ui`로 재판단 |
| `src/types/commerce.ts` 통짜 파일 | 그대로 유지 | 도메인별 분해 | **분해** | 도메인 모델·요청/응답 계약·통신 타입이 한 파일에 섞여 소유자가 불명확 |

---

## D — 상태 분류표 (5주차 표를 새 구조로 갱신)

| 상태 | Source of Truth | 소유 슬라이스/레이어 | 소비하는 곳 | 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과 | 서버 / TanStack Query | `entities/product/api`(목록), `_pages/home/api`(홈) | 홈, 상품 목록 | queryOptions만 재사용, 컴포넌트 state로 복사 안 함 |
| 검색·정렬·페이지 | URL / nuqs | `_pages/product-list/model` | 상품 목록 | `useProductListQuery`가 유일한 진입점, 별도 useState 없음 |
| 장바구니 | Zustand | `entities/cart/model` | widgets/header, features/add-to-cart | id 배열만 저장, 개수는 `useCartCount` selector로 파생 |
| 위시리스트 | Zustand | `entities/wishlist/model` | widgets/header, features/toggle-wishlist | 위와 동일, cart와 분리된 별도 store |
| Dialog 열림 여부 | React 로컬 상태 | `shared/ui/dialog`(Dialog 컴포넌트 자신) | 해당 UI | Dialog가 소유, controlled 시 부모가 열림 상태만 소유 |
| 검색어 초안 | React 로컬 상태 | `_pages/product-list/ui/ProductFilters` | 해당 폼 | 제출 전 입력값, 폼 밖에서 아무도 안 읽음 |

> 폴더를 옮기면서 서버 응답을 Zustand에 복사하거나 URL 상태를 별도 useState에 동기화하지 않는다. cart/wishlist 물리적 분리는 "저장 위치"만 나눈 것이고, 5주차가 정한 "비로그인 로컬 상태"라는 Source of Truth 분류는 그대로다.

---

## I — Interface (공개 API와 백엔드 경계)

### 각 슬라이스가 공개하는 것 / 숨기는 것

- **`entities/product`** — 공개: `ProductCard`(표현, `actions?: ReactNode` 슬롯), 순수 타입(`Product`, `Category`, `CategoryId`, `ProductSort`, `ProductListResponse`, `HomeResponse`, `ProductListQuery`). **숨김: `productListQueryOptions`·`fetchProducts`·`Badge`** — 슬라이스 루트 `index.ts`에서 재export하지 않는다.
- **`entities/cart`** — 공개: `useIsInCart`·`useCartCount`·`useToggleCart` selector 훅만. 숨김: `useCartStore` 인스턴스(외부가 store 구조를 몰라도 되게).
- **`entities/wishlist`** — cart와 대칭(`useIsWished`·`useWishCount`·`useToggleWish`).
- **`widgets/product-card`** — 공개: `ProductCardWithActions`.
- **`features/*`** — 각 버튼 컴포넌트.

### `ProductCard`와 장바구니·위시리스트 행위의 조합 방법

`entities/product`가 `features`를 import하면 역방향 의존이므로, `ProductCard`는 `actions` 슬롯만 받고 실제 조합은 `widgets/product-card`가 한다:
```
ProductCardWithActions
 ├─ entities/product: <ProductCard actions={...}/>
 └─ actions = <><ToggleWishlistButton/><AddToCartButton/></>  (features 2개)
```
`_pages/home`·`_pages/product-list`는 이 widget의 Public API만 import한다.

### Public API 사용 여부와 방식 (barrel vs Public API)

- `entities`·`features`·`widgets`·`_pages` 슬라이스 루트에 `index.ts`를 **Public API(계약)로** 둔다 — "외부가 알아도 되는 것은 이것뿐". barrel(습관적 재수출)이 아니다.
- **핵심 결정**: `entities/product/index.ts`는 `ProductCard`와 순수 타입만 재export하고 `productListQueryOptions`·`fetchProducts`(TanStack Query·fetch 런타임 코드)는 재export하지 않는다. 클라이언트 소비처(`_pages/product-list`)는 `@/entities/product/api/queries`를 **세그먼트 직접 경로**로 import한다. 이유는 아래 백엔드 경계 참고.
- `shared`에는 슬라이스 루트 `index.ts`를 두지 않는다 — 다양한 유틸이 섞여 하나로 재수출하면 무엇을 쓰는지 흐려진다(깊은 경로 직접 import).

### mock 백엔드(`src/app/api/**`)와의 경계

Route Handler 로직은 옮기지 않지만, 응답/도메인 타입은 재배치된 위치(`entities/product/api/types.ts`, `entities/product/model/types.ts`, `shared/api/types.ts`)에서 그대로 import한다. 같은 TS 프로젝트에서 같은 계약을 두 벌로 정의하면 한쪽만 고쳤을 때 어긋나므로, 타입 재정의보다 위치 이동 후 참조를 택했다. (`route.ts`가 `@/types/commerce`를 import하는 파일 3개 — home/products route, `_data/commerce.ts` — 는 grep으로 확인했다.)

**이 배치의 근거는 "백엔드가 entities를 하위참조하는 것이 정상이라서"가 아니다.** mock 백엔드는 FSD 레이어 트리 **바깥**이라 레이어 위계가 적용되지 않는다. 배치 근거는 **의존성 방향 회피** — 응답 타입을 `_pages/*/api`에 두면 백엔드가 프론트 `_pages`를 역참조하게 되는데, entities에 두면 이 역참조가 사라진다.

**번들 오염 차단**: `entities/product/api` 세그먼트에는 `types.ts`(타입)와 `queries.ts`(클라이언트 전용 TanStack Query)가 공존한다. mock 백엔드 `route.ts`가 배럴을 통해 `queries.ts`를 끌어오면 서버 번들에 클라이언트 쿼리 코드가 섞인다. 그래서 (1) `entities/product` 슬라이스 루트 `index.ts`는 `queryOptions`를 재export하지 않고, (2) `route.ts`는 `@/entities/product/api/types`를 파일 직접 경로로만 import한다. 아키텍처 규칙을 번들러 tree-shaking에 의존시키지 않는다.

---

## O — Optimization

- **캐시 정책 유지**: 홈 `staleTime` 5분, 목록 `staleTime` 30초, `gcTime` 5분 — 5주차 값 그대로. 폴더만 옮기는 라운드라 근거를 다시 검증하지 않는다.
- **`placeholderData`**: 목록의 페이지 전환 시 이전 결과 유지(필터 변경 시엔 undefined로 로딩 표시)는 "상품 목록 리소스의 표준 캐시 계약"으로 보고 `entities/product/api/queries.ts`가 소유한다.
- **에러 경계 범위**: 아래 "에러 처리 전략" 절 참고. 커밋 1에서는 손대지 않고, 커밋 2에서 5xx→route `error.tsx`, 4xx·빈 결과→화면 인라인으로 나눈다.
- **`loading.tsx` 안 만듦**: 현재 `Suspense`는 nuqs(`useSearchParams`) 정적 프리렌더 요구사항 때문에 있는 것이고, 실제 로딩 UI는 TanStack Query `isPending`이 전담한다. 같은 로딩을 두 메커니즘으로 이중 관리할 이유가 없다.
- **이번에 하지 않을 최적화**: 제네릭 응답 타입(`PaginatedResponse<T>`) — 페이지네이션 엔드포인트가 `/api/products` 하나뿐이라 재사용처 없는 추상화. 다음 페이지 prefetch, 검색 debounce 등도 이번 범위 밖.

---

## 에러 처리 전략 (2단계 순서)

> **왜 2단계인가:** mock은 4xx와 5xx를 **둘 다 실제로 낸다** — `scenario=unknown`·잘못된 page 값이면 400, `scenario=error`면 500(`src/app/api/*/route.ts` 확인). 다만 앱의 `fetchHome`/`fetchProducts`는 `scenario`를 **전달하지 않으므로** 이 에러들은 UI로 트리거되지 않고, 검증은 fetch를 임시로 실패시켜 한다(0단계 참고). 현재 앱은 홈·목록 모두 이 에러들을 **인라인**(`isError` + `refetch`)으로만 처리하고 `error.tsx`는 존재하지 않는다. 이 상태를 그대로 옮기는 게 커밋 1, 실제 에러 경계를 도입하는 게 커밋 2다.

### 커밋 1 — 구조 이동 (에러 동작 보존)

| 실패 유형 | 처리 위치 | 경계 전파 | 사용자 UI | 성격 |
| --- | --- | --- | --- | --- |
| 홈 데이터 에러(네트워크/5xx) | `_pages/home/ui/HomePage` 내부 `isError` | 아니오 | 메시지 + 다시 시도(`refetch`) | **5주차 그대로 보존** |
| 목록 데이터 에러(4xx/5xx) | `_pages/product-list/ui/ProductListPage` 내부 `isError` | 아니오 | 메시지 + 다시 시도(`refetch`) | **5주차 그대로 보존** |
| 담기/찜 토글 | 해당 없음 | — | — | 동기 로컬 state라 실패 없음 |

- 이 커밋은 `throwOnError`를 도입하지 않는다. 폴더만 옮기고 `isError` 분기 로직을 그대로 이식한다 → `pnpm check` 통과 + 0단계 동작 기준선의 시나리오가 **동일하게** 재현되어야 정상(에러 상태는 0단계에 적은 대로 fetch 강제 실패로 확인).

### 커밋 2 — 에러 전략 재설계 (의도적 동작 변경)

| 실패 유형 | 처리 위치 | 경계 전파 | 사용자 UI | 재시도 | 이 경계를 선택한 이유 |
| --- | --- | --- | --- | --- | --- |
| 상품 목록 조회 실패(5xx) | `app/products/error.tsx` | 예(`throwOnError`) | 공통 폴백 + 다시 시도 | `reset()` 세그먼트 재마운트 | 서버 오류는 화면 로직으로 복구 불가능한 예상 밖 실패 |
| 잘못된 검색 조건(4xx) | `_pages/product-list/ui/ProductListPage` 내부 | 아니오 | 인라인 에러 + 다시 시도 | `refetch()` | 사용자가 조건을 바꾸면 해결되는 복구 가능 실패. 화면 전체를 가릴 필요 없음 |
| 홈 조회 실패(전체) | `app/error.tsx` | 예(`throwOnError: true`) | 공통 폴백 + 다시 시도 | `reset()` | 홈 fetch는 요청 파라미터를 싣지 않아 사용자가 유발하는 복구 가능한 4xx가 없다 — 발생 가능한 실패가 전부 예상 밖 성격이라 전부 경계로 |
| 예상하지 못한 렌더링 오류 | `app/error.tsx`, `app/products/error.tsx` | 예 | 공통 폴백 | `reset()` | React 렌더링 중 오류의 catch-all 안전장치 |
| 장바구니/위시 행위의 비즈니스 오류 | 해당 없음 | — | — | — | 로컬 state 동기 토글이라 실패할 수 없음. 서버 동기화(로그인) 생기면 필요 |

- **전파 기준**: 목록은 `throwOnError: (e) => e instanceof ApiError && e.status >= 500`으로 5xx만 경계에 던지고 4xx·빈 결과는 인라인. 홈은 복구 가능한 4xx가 없어 `throwOnError: true`.
- **검증 방법**(위 0단계와 동일 주의): 앱은 `scenario`를 API에 전달하지 않으므로 에러는 UI 조작으로 트리거되지 않는다. fetch를 임시로 강제 실패시켜 확인한다 — **500으로 강제**하면 목록은 `app/products/error.tsx` 경계로, 홈은 `throwOnError: true`라 `app/error.tsx` 경계로 간다. **400으로 강제**하면 **목록은 인라인**(`throwOnError` 조건 미충족), **홈은 `throwOnError: true`라 경계로** 간다. 즉 "4xx는 인라인"은 목록에 한한 규칙이고 홈은 4xx도 경계다.
- **이 재설계가 근거 있는 결정인 이유** — [week06-error-handling-research.md](./week06-error-handling-research.md)에서 교차검증:
  - 4xx/5xx를 재시도 관점에서 다르게 다루는 것은 **업계 컨센서스**(TkDodo/TanStack Query 메인테이너, Baeldung, api4ai). 4xx는 요청 자체가 틀려 같은 요청 재시도가 무의미(사용자가 조건을 바꿔야 해결) → 인라인, 5xx는 일시적일 수 있어 재시도 대상 → 경계.
  - 5xx를 route `error.tsx`로 격리하는 것은 **Next.js 권장 방향**(한 섹션 실패가 앱 전체를 무너뜨리지 않게).
  - 이 기준은 이미 `providers.tsx`의 `shouldRetry`(4xx 즉시 실패, 5xx·네트워크만 재시도) 방향과 일치한다.

### Error Boundary가 못 잡는 것

React Error Boundary(및 Next `error.tsx`)는 **렌더링 중 throw된 오류만** 잡는다. `useEffect`·이벤트 핸들러(onClick)의 비동기 오류는 못 잡는다. 이 프로젝트의 담기/찜 토글은 동기 로컬 state 변경이라 던질 에러가 없고, TanStack Query 실패는 `throwOnError`로 렌더링 오류로 변환돼야 경계가 잡는다. 서버 저장 같은 실패 가능 비동기가 생기면 해당 핸들러에서 try/catch로 직접 처리한다.

---

## 삭제 시나리오 자가 검증 (5단계)

마이그레이션 완료 후 `grep -rln -iE "wishlist|wish|찜"`(examples·Vite 잔재 제외)로 실측한다.

**"위시리스트 기능을 통째로 제거한다면"**
- 설계 시점 예상 — 삭제: `entities/wishlist/`, `features/toggle-wishlist/` / 수정: `widgets/header/ui/Header.tsx`, `widgets/product-card/ui/ProductCardWithActions.tsx`
- **실측 결과** (`grep -rn -iE "wish|찜" src`, 마이그레이션 후):
  - ✅ 삭제 대상이 `entities/wishlist/`(index·model/store)·`features/toggle-wishlist/`(index·ui) **2개 폴더에 완전 응집** — 부분 수정 없이 폴더째 삭제 가능
  - ✅ 수정 대상은 예측과 정확히 일치 — `widgets/header/ui/Header.tsx`(`useWishCount` import + `<span>위시리스트 …</span>` 제거), `widgets/product-card/ui/ProductCardWithActions.tsx`(`ToggleWishlistButton` import·조합 제거)
  - ✅ 그 외 매치(`entities/product/ui/ProductCard.tsx`, Header·ProductCardWithActions의 다른 라인)는 전부 **주석**("담기/찜처럼 …")이라 실제 코드 의존이 아니다 — `entities/product`는 actions 슬롯만 받아 위시리스트를 코드로 모른다
  - 판정: 삭제 2슬라이스 + 수정 2위젯으로 grep 없이 예측 가능. **응집 성공.**
- **판정 근거**: cart와 완전 분리했기에 store 파일을 부분 수정할 일이 없다(폴더째 삭제). toggle 헬퍼를 `shared/lib`로 추출했다면 "shared 파일이 아직 cart에 쓰이는지 확인"이라는 조건부 삭제가 끼어들었을 것 — 3줄 중복을 감수한 결정이 이 리트머스에서 값을 한다.

**"신상품 뱃지를 상품 카드에 추가한다면"**
- 터치할 파일: `entities/product/model/types.ts`(판정 필드 없으면 추가), `entities/product/ui/ProductCard.tsx`(뱃지 렌더), `entities/product/ui/Badge.tsx`(기존 variant 재사용) — **전부 `entities/product` 폴더 안**.
- **판정 근거**: Badge를 `entities/product`에 둔 잠정 결정 덕에 상품 표현 변경이 한 슬라이스 안에서 끝난다(Badge가 범용 `shared/ui`에 있었다면 이 변경이 두 레이어에 걸친다).

---

## FSD 이해 확인 질문

1. **`ProductCard`가 찜 버튼을 직접 import하면?** `entities → features` 역방향 의존을 어긴다. 상품 표현과 행위를 함께 보여줘야 하면 `widgets/product-card`에서 조합한다(`ProductCard`는 `actions` 슬롯만 받음).
2. **한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하나?** 아니다. 이 프로젝트의 검색·정렬·페이지네이션은 `product-list` 페이지 하나에서만 쓰여 `_pages/product-list` 안에 뒀다. 헤더 검색바처럼 다른 곳에서도 필요해지면 feature로 승격한다.
3. **`formatPrice`는 항상 `shared/lib`인가?** 통화·회원 등급·상품 정책이 섞이지 않는 순수 숫자 포맷이라 이 프로젝트에선 `shared/lib`이 맞다. 회원 등급별 할인 같은 비즈니스 규칙이 섞이면 `entities/product`나 별도 pricing 엔티티로 옮겨야 한다.
4. **두 feature가 협력해야 할 때 어디서 조합했나?** `widgets/product-card`에서 `add-to-cart`·`toggle-wishlist`를 조합했다(feature끼리 직접 import 안 함). `_pages/home`·`_pages/product-list` 둘 다 이 widget을 쓴다.
5. **폴더 이동 후에도 TanStack Query와 Zustand 데이터를 서로 안 복사한 이유?** 서버 조회 결과는 `entities/product/api`·`_pages/home/api`의 queryOptions로만 다루고 Zustand(`entities/cart`·`entities/wishlist`)에는 상품 id만 저장한다. 서버 원본을 클라이언트 상태로 복사하면 두 저장소가 어긋날 때 진실이 무엇인지 알 수 없다.
6. **barrel과 Public API의 차이, 나는 어느 쪽을 썼나?** barrel은 경계 의도 없는 습관적 재수출, Public API는 "외부에 이것만 공개한다"는 계약이다. `entities`·`features`·`widgets`·`_pages`에 index.ts를 계약으로 썼고(예: `entities/product`는 `queryOptions`·`Badge`를 숨기고 `ProductCard`·타입만 공개), `shared`에는 두지 않았다.

---

## AI 활용 표기

- 이 RFC와 마이그레이션 계획의 초안은 Claude Code로 작성했다.
- **설계 검증**: 5개 핵심 결정(ProductCard 분리, cart/wishlist store 분리, queryOptions 위치, 응답 타입 위치, Badge 위치)을 적대적 리뷰로 다퉜고, 응답 타입·queryOptions를 `entities/product`로 두는 배치가 백엔드의 `_pages` 역참조를 없애는 선택임을 확인했다.
- **에러 전략 재검증**: "5xx→boundary, 4xx→inline"을 최종안으로 확정하기 전, 이를 적대적으로 공격했다 — 순수 보존안(인라인 유지 + 아무 경계 없음)은 "실제로 아무것도 안 잡는 `error.tsx`"를 만들고 4xx/5xx 구분을 버린다는 점이 드러나, **구조 이동(커밋1, 보존)과 에러 재설계(커밋2, 5xx 경계)를 분리하는 순서형**으로 결론냈다. 외부 근거는 [week06-error-handling-research.md](./week06-error-handling-research.md)에 출처와 함께 기록했다.
- 모든 결정의 근거는 위 "애매한 파일 결정표"의 근거 칸과 각 절에 기록했다. 최종 검토를 제출 전 직접 진행했다.
